export type ForumPost = {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  imageUrls: string[]; // ✅ now supported
  createdAt: string;
};

export type ForumComment = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  body: string; // ✅ body exists
  createdAt: string;
};
