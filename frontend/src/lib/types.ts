export type User = {
  id: number | null;
  user_name: string;
  email: string;
  photo_path: string | null;
};

export type Post = {
  post_id: number | null;
  content: string;
  user_id: number;
  created_at: string;
  modified_at: string;
  photo_path: string | null;
};

export type PostFeed = Post & {
  likes_count: number;
  user_name: string;
  user_photo: string | null;
};

export type Comment = {
  comment_id: number | null;
  user_id: number;
  post_id: number;
  created_at: string;
  modified_at: string;
  content: string;
};

export type CommentFeed = Comment & {
  user_name: string;
  likes_count: number;
  user_photo: string | null;
};

export type Like = {
  id: number | null;
  user_id: number;
  post_id: number | null;
  comment_id: number | null;
};

export type UsersWhoLiked = {
  user_id: number;
  user_name: string;
  user_photo: string | null;
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type RegisterPayload = {
  user_name: string;
  email: string;
  password: string;
  photo_path?: string | null;
};

export type RegisterResponse = {
  user_name: string;
  email: string;
  created_at: string;
};

export type UpdateUserPayload = {
  user_name?: string;
  email?: string;
  password?: string;
  photo_path?: string | null;
};

export type PostPayload = {
  content: string;
  photo_path?: string | null;
};

export type CommentPayload = {
  content: string;
};

export type MessageResponse = {
  msg: string;
};

export type UploadResponse = {
  path: string;
};
