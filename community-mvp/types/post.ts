export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt?: Date;
};

export type Post = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type Comment = {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  createdAt: Date | null;
};

export type CreatePostPayload = {
  title: string;
  content: string;
  imageUri?: string | null;
};

export type UpdatePostPayload = {
  title?: string;
  content?: string;
  imageUri?: string | null;
  removeImage?: boolean;
};

export type CreateCommentPayload = {
  content: string;
};

