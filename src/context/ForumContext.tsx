import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "../lib/supabase";

export type ForumPost = {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  createdAt: number;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  imagePaths: string[];
  imageUrls: string[];
};

type ForumContextValue = {
  posts: ForumPost[];
  refreshPosts: () => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  getPostById: (id: string) => ForumPost | undefined;
};

const ForumContext = createContext<ForumContextValue | undefined>(undefined);

export const ForumProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const inFlightLikesRef = useRef<Set<string>>(new Set());

  // -----------------------------
  // LOAD POSTS
  // -----------------------------
  const loadPosts = useCallback(async () => {
    try {
    const { data: postRows, error } = await supabase
      .from("forum_posts")
      .select(
        `
        id,
        title,
        body,
        created_at,
        author_id,
        image_paths,
        profiles!forum_posts_author_id_fkey ( username )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Forum load error", error);
      return;
    }

    if (!postRows) {
      setPosts([]);
      return;
    }

    const postIds = postRows.map((p) => p.id);

    // -----------------------------
    // COMMENT COUNTS
    // -----------------------------
    const { data: commentRows } = await supabase
      .from("forum_comments")
      .select("post_id")
      .in("post_id", postIds);

    const commentCounts: Record<string, number> = {};
    commentRows?.forEach((c: any) => {
      commentCounts[c.post_id] = (commentCounts[c.post_id] ?? 0) + 1;
    });

    // -----------------------------
    // LIKE COUNTS
    // -----------------------------
    const { data: likeRows } = await supabase
      .from("forum_likes")
      .select("post_id")
      .in("post_id", postIds);

    const likeCounts: Record<string, number> = {};
    likeRows?.forEach((l: any) => {
      likeCounts[l.post_id] = (likeCounts[l.post_id] ?? 0) + 1;
    });

    // -----------------------------
    // CURRENT USER LIKES
    // -----------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const likedByUser: Record<string, boolean> = {};

    if (user) {
      const { data: myLikes } = await supabase
        .from("forum_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds);

      myLikes?.forEach((l: any) => {
        likedByUser[l.post_id] = true;
      });
    }

    const mapped: ForumPost[] = postRows.map((p: any) => {
      const imagePaths = p.image_paths ?? [];

      const imageUrls = imagePaths.map((path: string) => {
        const { data } = supabase.storage
          .from("forum-images")
          .getPublicUrl(path);

        return data.publicUrl;
      });

      return {
        id: p.id,
        authorId: p.author_id,
        title: p.title,
        body: p.body,
        createdAt: new Date(p.created_at).getTime(),
        authorName: p.profiles?.username ?? "Anonymous",
        commentCount: commentCounts[p.id] ?? 0,
        likeCount: likeCounts[p.id] ?? 0,
        likedByMe: likedByUser[p.id] ?? false,
        imagePaths,
        imageUrls,
      };
    });
    setPosts(mapped);
    } catch (e) {
      console.error("[Forum] loadPosts error", e);
    }
  }, []);

  // -----------------------------
  // TOGGLE LIKE (Stable server-driven)
  // -----------------------------
  const toggleLike = useCallback(async (postId: string) => {
    if (inFlightLikesRef.current.has(postId)) return;
    inFlightLikesRef.current.add(postId);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      inFlightLikesRef.current.delete(postId);
      return;
    }

    try {
      // Read current like state from the functional updater to avoid stale closure.
      let currentlyLiked = false;
      setPosts((prev) => {
        currentlyLiked = prev.find((p) => p.id === postId)?.likedByMe ?? false;
        return prev; // no mutation, just reading
      });

      // Normalize duplicates and apply toggle.
      const { error: deleteError } = await supabase
        .from("forum_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      if (!currentlyLiked) {
        const { error: insertError } = await supabase.from("forum_likes").insert(
          {
            post_id: postId,
            user_id: user.id,
          },
        );
        if (insertError) throw insertError;
      }

      // Read canonical state from DB for this post.
      const { data: postLikeRows, error: postLikeRowsError } = await supabase
        .from("forum_likes")
        .select("post_id")
        .eq("post_id", postId);

      if (postLikeRowsError) throw postLikeRowsError;

      const likeCount = postLikeRows?.length ?? 0;
      const { data: myLikeRows, error: myLikeRowsError } = await supabase
        .from("forum_likes")
        .select("post_id")
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (myLikeRowsError) throw myLikeRowsError;

      const likedByMe = (myLikeRows?.length ?? 0) > 0;

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likedByMe,
                likeCount,
              }
            : p,
        ),
      );
    } catch (error) {
      console.error("[Forum] toggleLike failed", error);
    } finally {
      inFlightLikesRef.current.delete(postId);
    }
  }, []);

  // -----------------------------
  // ADD COMMENT (Optimistic Count)
  // -----------------------------
  const addComment = useCallback(async (postId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      await supabase.from("forum_comments").insert({
        post_id: postId,
        author_id: user.id,
        text: trimmed,
      });

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                commentCount: p.commentCount + 1,
              }
            : p,
        ),
      );
    } catch (e) {
      console.error("[Forum] addComment error", e);
    }
  }, []);

  // -----------------------------
  // DELETE POST
  // -----------------------------
  const deletePost = useCallback(async (postId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      await supabase
        .from("forum_posts")
        .delete()
        .eq("id", postId)
        .eq("author_id", user.id);

      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (e) {
      console.error("[Forum] deletePost error", e);
    }
  }, []);

  // -----------------------------
  // REALTIME
  // -----------------------------
  useEffect(() => {
    loadPosts().catch((err) =>
      console.error("[Forum] Initial loadPosts failed:", err),
    );

    const channel = supabase
      .channel("forum_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "forum_posts" },
        loadPosts,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "forum_likes" },
        loadPosts,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "forum_comments" },
        loadPosts,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadPosts]);

  const value = useMemo(
    () => ({
      posts,
      refreshPosts: loadPosts,
      toggleLike,
      addComment,
      deletePost,
      getPostById: (id: string) => posts.find((p) => p.id === id),
    }),
    [posts, loadPosts, toggleLike, addComment, deletePost],
  );

  return (
    <ForumContext.Provider value={value}>{children}</ForumContext.Provider>
  );
};

export const useForum = () => {
  const ctx = useContext(ForumContext);
  if (!ctx) {
    throw new Error("useForum must be used within ForumProvider");
  }
  return ctx;
};
