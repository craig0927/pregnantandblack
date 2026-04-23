import { Ionicons } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button, Card, NeuInput } from "../../components/Ui";
import { supabase } from "../../lib/supabase";
import { colors, fonts, spacing } from "../../theme/theme";
import type { ForumStackParamList } from "../../navigation/ForumStack";

const FULL_WIDTH = Dimensions.get("window").width;

function FullWidthImage({ uri, onPress }: { uri: string; onPress?: () => void }) {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(220);

  useEffect(() => {
    let alive = true;
    Image.getSize(uri, (w, h) => {
      if (alive && w > 0 && width > 0) setHeight((h / w) * width);
    });
    return () => { alive = false; };
  }, [uri, width]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth > 0 && nextWidth !== width) setWidth(nextWidth);
  }, [width]);

  return (
    <Pressable onPress={onPress} onLayout={handleLayout}>
      <Image
        source={{ uri }}
        style={{ width: "100%", height, borderRadius: 12, marginBottom: spacing.md }}
        resizeMode="cover"
      />
    </Pressable>
  );
}

type Props = NativeStackScreenProps<ForumStackParamList, "ForumPostDetail">;

type Comment = {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  author_name?: string;
  parent_comment_id?: string | null;
  image_paths?: string[];
  likeCount: number;
  likedByMe: boolean;
};

type Post = {
  id: string;
  title: string;
  body: string;
  author_id: string;
  image_paths?: string[];
};

export default function ForumPostDetail({ route, navigation }: Props) {
  const headerHeight = useHeaderHeight();
  const { postId, title, commentId } = route.params as {
    postId: string;
    title: string;
    commentId?: string;
  };
  const commentChannelNameRef = useRef(
    `forum-comments-${postId}-${Math.random().toString(36).slice(2)}`,
  );

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [commentText, setCommentText] = useState("");
  const [commentImages, setCommentImages] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const collapseInitialized = React.useRef(false);
  const commentsListRef = useRef<FlatList>(null);
  const hasScrolledToComment = useRef(false);
  const inFlightCommentLikesRef = useRef<Set<string>>(new Set());
  const submittingCommentRef = useRef(false);
  const profileCacheRef = useRef<Map<string, string>>(new Map());

  const [highlightedComment, setHighlightedComment] = useState<string | null>(
    null,
  );

  const attachCommentUsernames = useCallback(async (rows: any[]) => {
    if (!rows.length) return rows;

    const cache = profileCacheRef.current;

    const uncachedIds = Array.from(
      new Set(
        rows
          .map((row) => row?.author_id)
          .filter(
            (id): id is string =>
              typeof id === "string" && id.length > 0 && !cache.has(id),
          ),
      ),
    );

    if (uncachedIds.length > 0) {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", uncachedIds);

      if (error) {
        console.error("[ForumPostDetail] author lookup failed:", error);
      } else {
        profiles?.forEach((p: any) => {
          cache.set(p.id, p.username ?? "Anonymous");
        });
      }
    }

    return rows.map((row) => ({
      ...row,
      author_name: cache.get(row.author_id) ?? "Anonymous",
    }));
  }, []);

  const expandParentChain = useCallback(
    (targetId: string) => {
      const parentMap: Record<string, string | null> = {};

      comments.forEach((c) => {
        parentMap[c.id] = c.parent_comment_id ?? null;
      });

      const toExpand = new Set<string>();
      let current = parentMap[targetId];

      while (current) {
        toExpand.add(current);
        current = parentMap[current];
      }

      setCollapsed((prev) => {
        const next = new Set(prev);
        toExpand.forEach((id) => next.delete(id));
        return next;
      });
    },
    [comments],
  );

  /*
  ============================
  USER
  ============================
  */

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    };

    loadUser();
  }, []);

  /*
  ============================
  HEADER
  ============================
  */

  useLayoutEffect(() => {
    navigation.setOptions({
      title: post?.title?.trim() || title || "Community Post",
    });
  }, [navigation, post?.title, title]);

  /*
  ============================
  LOAD DATA
  ============================
  */

  const loadData = useCallback(async () => {
    const { data: postData } = await supabase
      .from("forum_posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (postData) setPost(postData);

    const { data: commentData } = await supabase
      .from("forum_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (!commentData) return;

    const ids = commentData.map((c) => c.id);

    const { data: likes } = await supabase
      .from("forum_comment_likes")
      .select("comment_id, user_id")
      .in("comment_id", ids);

    const likeCounts: Record<string, number> = {};
    const likedByMe: Record<string, boolean> = {};

    likes?.forEach((l: any) => {
      likeCounts[l.comment_id] = (likeCounts[l.comment_id] ?? 0) + 1;

      if (l.user_id === userId) likedByMe[l.comment_id] = true;
    });

    const commentsWithNames = await attachCommentUsernames(commentData);

    const mapped = commentsWithNames.map((c: any) => ({
      ...c,
      image_paths: c.image_paths ?? [],
      likeCount: likeCounts[c.id] ?? 0,
      likedByMe: likedByMe[c.id] ?? false,
    }));

    setComments(mapped);
  }, [attachCommentUsernames, postId, userId]);

  useEffect(() => {
    if (userId) loadData();
  }, [userId, loadData]);

  useEffect(() => {
    if (collapseInitialized.current) return;
    if (!comments.length) return;

    const parents = new Set<string>();

    comments.forEach((c) => {
      if (c.parent_comment_id) {
        parents.add(c.parent_comment_id);
      }
    });

    setCollapsed(parents);
    collapseInitialized.current = true;
  }, [comments]);

  /*
  ============================
  LIVE COMMENTS + LIKES
  ============================
  */

  useEffect(() => {
    const channel = supabase.channel(commentChannelNameRef.current);

    channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "forum_comments",
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          const comment = payload.new as any;
          const [commentWithName] = await attachCommentUsernames([comment]);

          setComments((prev) => {
            if (prev.some((c) => c.id === commentWithName.id)) return prev;
            return [{ ...commentWithName, likeCount: 0, likedByMe: false }, ...prev];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "forum_comments",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setComments((prev) =>
            prev.map((c) =>
              c.id === updated.id ? { ...c, text: updated.text } : c,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "forum_comments",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const deleted = payload.old as any;
          setComments((prev) => prev.filter((c) => c.id !== deleted.id));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "forum_comment_likes" },
        (payload) => {
          const row = (payload.new ?? payload.old) as any;
          const commentId: string = row?.comment_id;
          if (!commentId) return;
          if (row?.user_id === userId) return;

          setComments((prev) => {
            const exists = prev.some((c) => c.id === commentId);
            if (!exists) return prev;

            const delta =
              payload.eventType === "INSERT"
                ? 1
                : payload.eventType === "DELETE"
                  ? -1
                  : 0;

            return prev.map((c) => {
              if (c.id !== commentId) return c;
              const likedByMe =
                payload.eventType === "INSERT" && row.user_id === userId
                  ? true
                  : payload.eventType === "DELETE" && row.user_id === userId
                    ? false
                    : c.likedByMe;
              return {
                ...c,
                likeCount: Math.max(0, c.likeCount + delta),
                likedByMe,
              };
            });
          });
        },
      );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [attachCommentUsernames, postId, userId]);

  /*
  ============================
  COMMENT TREE
  ============================
  */

  const commentTree = useMemo(() => {
    const map: Record<string, Comment[]> = {};

    comments.forEach((c) => {
      const parent = c.parent_comment_id ?? "root";

      if (!map[parent]) map[parent] = [];
      map[parent].push(c);
    });

    return map;
  }, [comments]);

  /*
  ============================
  FLATTEN TREE
  ============================
  */

  const flattened = useMemo(() => {
    const result: (Comment & { depth: number })[] = [];

    const walk = (parent: string, depth: number) => {
      const children = commentTree[parent] || [];

      children.forEach((c) => {
        result.push({ ...c, depth });

        if (!collapsed.has(c.id)) {
          walk(c.id, depth + 1);
        }
      });
    };

    walk("root", 0);
    return result;
  }, [commentTree, collapsed]);

  /*
  ============================
  SCROLL TO COMMENT
  ============================
  */

  useEffect(() => {
    if (!commentId) return;
    if (!flattened.length) return;
    if (hasScrolledToComment.current) return;

    expandParentChain(commentId);

    const index = flattened.findIndex((c) => c.id === commentId);

    if (index !== -1) {
      hasScrolledToComment.current = true;
      setHighlightedComment(commentId);
      setTimeout(() => {
        commentsListRef.current?.scrollToIndex({
          index,
          animated: true,
        });
      }, 200);
      setTimeout(() => {
        setHighlightedComment(null);
      }, 2000);
    }
  }, [commentId, flattened, expandParentChain]);

  /*
  ============================
  IMAGE PICKER
  ============================
  */

  const pickCommentImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 3,
    });

    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setCommentImages((prev) => [...prev, ...uris]);
    }
  };

  /*
  ============================
  ADD COMMENT
  ============================
  */

  const handleAddComment = async () => {
    if (!commentText.trim() && commentImages.length === 0) return;
    if (submittingCommentRef.current) return;
    submittingCommentRef.current = true;

    try {
      if (editingCommentId) {
        const { error } = await supabase
          .from("forum_comments")
          .update({ text: commentText.trim() })
          .eq("id", editingCommentId)
          .eq("author_id", userId);

        if (error) {
          console.error("Comment update error:", error);
          return;
        }

        setComments((prev) =>
          prev.map((c) =>
            c.id === editingCommentId
              ? {
                  ...c,
                  text: commentText.trim(),
                }
              : c,
          ),
        );

        setEditingCommentId(null);
        setCommentText("");
        setCommentImages([]);
        setReplyingTo(null);
        return;
      }

      const { data, error } = await supabase
        .from("forum_comments")
        .insert({
          post_id: postId,
          author_id: userId,
          text: commentText.trim(),
          image_paths: commentImages,
          parent_comment_id: replyingTo,
        })
        .select()
        .single();

      if (error) {
        console.error("Comment insert error:", error);
        return;
      }

      if (data) {
        const [commentWithName] = await attachCommentUsernames([data]);

        setComments((prev) => [
          {
            ...commentWithName,
            likeCount: 0,
            likedByMe: false,
          },
          ...prev,
        ]);

        setCommentText("");
        setCommentImages([]);
        setReplyingTo(null);
      }
    } finally {
      submittingCommentRef.current = false;
    }
  };

  /*
  ============================
  LIKE COMMENT
  ============================
  */

  const toggleCommentLike = async (id: string) => {
    if (!userId) return;
    if (inFlightCommentLikesRef.current.has(id)) return;
    inFlightCommentLikesRef.current.add(id);

    try {
      const currentlyLiked = comments.find((c) => c.id === id)?.likedByMe ?? false;

      // Normalize duplicates and apply toggle operation.
      const { error: deleteError } = await supabase
        .from("forum_comment_likes")
        .delete()
        .eq("comment_id", id)
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      if (!currentlyLiked) {
        const { error: insertError } = await supabase
          .from("forum_comment_likes")
          .insert({
            comment_id: id,
            user_id: userId,
          });
        if (insertError) throw insertError;
      }

      // Read canonical state for this comment (both queries in parallel).
      const [countResult, myRowsResult] = await Promise.all([
        supabase
          .from("forum_comment_likes")
          .select("*", { count: "exact", head: true })
          .eq("comment_id", id),
        supabase
          .from("forum_comment_likes")
          .select("comment_id")
          .eq("comment_id", id)
          .eq("user_id", userId),
      ]);

      if (countResult.error) throw countResult.error;
      if (myRowsResult.error) throw myRowsResult.error;

      const likeCount = countResult.count;
      const likedByMe = (myRowsResult.data?.length ?? 0) > 0;

      setComments((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                likedByMe,
                likeCount: likeCount ?? 0,
              }
            : c,
        ),
      );
    } catch (error) {
      console.error("[ForumPostDetail] toggleCommentLike failed", error);
    } finally {
      inFlightCommentLikesRef.current.delete(id);
    }
  };

  /*
  ============================
  DELETE COMMENT
  ============================
  */

  const handleDeleteComment = async (id: string) => {
    const mine = comments.find((c) => c.id === id)?.author_id === userId;
    if (!mine) {
      Alert.alert("Unavailable", "You can only delete your own comments.");
      return;
    }

    const { error } = await supabase.from("forum_comments").delete().eq("id", id);

    if (error) {
      Alert.alert("Unable to delete", "Please try again.");
      return;
    }

    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const openCommentMenu = (item: Comment) => {
    const isOwner = userId === item.author_id;
    const notAllowed = () =>
      Alert.alert(
        "Unavailable",
        "You can only edit or delete your own comments.",
      );

    Alert.alert("Comment options", "", [
      {
        text: "Edit",
        onPress: () => {
          if (!isOwner) return notAllowed();
          setEditingCommentId(item.id);
          setCommentText(item.text ?? "");
          setReplyingTo(null);
          setCommentImages([]);
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          if (!isOwner) return notAllowed();
          handleDeleteComment(item.id);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  /*
  ============================
  COLLAPSE THREAD
  ============================
  */

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });
  };

  /*
  ============================
  RENDER COMMENT
  ============================
  */

  const renderComment = ({ item }: any) => {
    const replyCount = commentTree[item.id]?.length ?? 0;

    return (
      <Card
        style={[
          styles.commentCard,
          { marginLeft: item.depth * 16 },
          item.id === highlightedComment && styles.highlightComment,
        ]}
      >
        <Pressable
          style={styles.commentMenuBtn}
          onPress={() => openCommentMenu(item)}
          hitSlop={10}
        >
          <Ionicons name="ellipsis-horizontal" size={16} color={colors.warmGray} />
        </Pressable>

        <Pressable>
          <Text style={styles.commentAuthor}>{item.author_name ?? "Anonymous"}</Text>
          <Text style={styles.commentText}>{item.text}</Text>
        </Pressable>

        {item.image_paths?.map((uri: string) => (
          <Pressable key={uri} onPress={() => setLightboxUri(uri)}>
            <Image source={{ uri }} style={styles.commentImage} />
          </Pressable>
        ))}

        <View style={styles.commentActions}>
          <Pressable
            onPress={() => toggleCommentLike(item.id)}
            style={styles.actionBtn}
          >
            <Ionicons
              name={item.likedByMe ? "heart" : "heart-outline"}
              size={16}
              color={item.likedByMe ? "#EF4444" : colors.charcoal}
            />
            <Text style={styles.actionText}>{item.likeCount}</Text>
          </Pressable>

          <Pressable onPress={() => setReplyingTo(item.id)}>
            <Ionicons name="chatbubble-outline" size={16} />
          </Pressable>
        </View>

        {replyCount > 0 && (
          <Pressable
            style={styles.replyToggle}
            onPress={() => toggleCollapse(item.id)}
          >
            <Ionicons
              name={collapsed.has(item.id) ? "chevron-forward" : "chevron-down"}
              size={16}
              color="#6b7280"
              style={{ marginTop: 6 }}
            />

            <Text style={styles.replyPreview}>
              {replyCount} repl{replyCount === 1 ? "y" : "ies"}
            </Text>
          </Pressable>
        )}
      </Card>
    );
  };

  /*
  ============================
  HEADER
  ============================
  */

  const renderHeader = useCallback(() => {
    if (!post) return null;

    return (
      <View>
        <Card style={styles.postCard}>
          <Text style={styles.postBody}>{post.body}</Text>

          {post.image_paths?.map((path) => {
            const { data } = supabase.storage
              .from("forum-images")
              .getPublicUrl(path);
            return (
              <FullWidthImage
                key={path}
                uri={data.publicUrl}
                onPress={() => setLightboxUri(data.publicUrl)}
              />
            );
          })}
        </Card>

        <Text style={styles.sectionTitle}>Comments</Text>
      </View>
    );
  }, [post]);

  if (!post) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.cream }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={headerHeight}
    >
      <View style={{ flex: 1 }}>
        <FlatList
          ref={commentsListRef}
          data={flattened}
          removeClippedSubviews
          keyExtractor={(item) => `comment-${item.id}`}
          renderItem={renderComment}
          ListHeaderComponent={renderHeader}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              commentsListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
              });
            }, 400);
          }}
          contentContainerStyle={{
            padding: spacing.md,
            paddingBottom: 120,
          }}
        />
      </View>

      {commentImages.length > 0 && (
        <View style={styles.previewRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {commentImages.map((uri) => (
              <View key={uri} style={styles.previewWrapper}>
                <Image source={{ uri }} style={styles.previewImage} />

                <Pressable
                  style={styles.previewDelete}
                  onPress={() =>
                    setCommentImages((prev) =>
                      prev.filter((img) => img !== uri),
                    )
                  }
                >
                  <Ionicons name="close" size={14} color="white" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {(replyingTo || editingCommentId) && (
        <View style={styles.replyIndicator}>
          <Text style={styles.replyIndicatorText}>
            {editingCommentId ? "Editing comment" : "Replying to comment"}
          </Text>

          <Pressable
            onPress={() => {
              setReplyingTo(null);
              setEditingCommentId(null);
              setCommentText("");
              setCommentImages([]);
            }}
          >
            <Ionicons name="close" size={18} />
          </Pressable>
        </View>
      )}

      <View style={styles.commentBar}>
        <Pressable onPress={pickCommentImage} disabled={!!editingCommentId}>
          <Ionicons
            name="image-outline"
            size={26}
            color={editingCommentId ? colors.warmGray : colors.charcoal}
          />
        </Pressable>
        <NeuInput
          value={commentText}
          onChangeText={setCommentText}
          placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
          placeholderTextColor={colors.gray400}
          style={styles.commentInput}
          multiline
        />
        <Button
          onPress={handleAddComment}
          label=""
          variant="outline"
          style={styles.sendBtn}
          disabled={!commentText.trim() && commentImages.length === 0}
          leftIcon={<Ionicons name="send" size={16} color={colors.warmGray} />}
        />
      </View>

      <Modal
        visible={!!lightboxUri}
        transparent
        animationType="fade"
        onRequestClose={() => setLightboxUri(null)}
        statusBarTranslucent
      >
        <Pressable style={styles.lightboxBackdrop} onPress={() => setLightboxUri(null)}>
          <Pressable style={styles.lightboxClose} onPress={() => setLightboxUri(null)} hitSlop={12}>
            <Ionicons name="close" size={22} color="white" />
          </Pressable>
          {lightboxUri && (
            <Image
              source={{ uri: lightboxUri }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: colors.cream,
    marginBottom: spacing.lg,
  },
  postBody: {
    fontSize: 15,
    marginBottom: spacing.md,
    fontFamily: fonts.regular,
  },

  postImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: spacing.md,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.coral,
    marginBottom: spacing.xxl,
    fontFamily: fonts.bold,
  },

  commentCard: {
    backgroundColor: colors.cream,
    marginBottom: spacing.md,
  },
  commentMenuBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 2,
  },

  commentImage: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    marginTop: spacing.sm,
  },

  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },

  replyPreview: {
    marginTop: 6,
    color: "#6b7280",
    fontWeight: "600",
    fontFamily: fonts.semiBold,
  },

  previewRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: colors.cream,
    paddingTop: spacing.lg,
    overflow: "visible",
  },

  previewWrapper: {
    position: "relative",
    marginRight: spacing.sm,
  },

  previewImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },

  previewDelete: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  commentBar: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#eee",
    padding: spacing.sm,
    backgroundColor: colors.cream,
  },

  commentInput: {
    flex: 1,
    marginHorizontal: spacing.sm,
    minHeight: 44,
    paddingTop: 10,
    paddingBottom: 10,
    color: colors.charcoal,
    textAlignVertical: "center",
  },

  sendBtn: {
    width: 44,
    height: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: "center",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    color: colors.charcoal,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  replyIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#f9fafb",
  },
  replyIndicatorText: {
    color: "#6b7280",
    fontSize: 13,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },

  commentText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.warmGray,
    marginBottom: 4,
    paddingRight: 20,
    fontFamily: fonts.bold,
  },
  replyToggle: {
    flexDirection: "row",
    alignItems: "center",
    //gap: 4,
    marginTop: 4,
  },
  highlightComment: {
    borderWidth: 2,
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  lightboxImage: {
    width: FULL_WIDTH,
    height: "100%",
  },
  lightboxClose: {
    position: "absolute",
    top: 52,
    right: 16,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,
    padding: 8,
  },
});
