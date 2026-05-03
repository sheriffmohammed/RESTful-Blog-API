import type {
  Comment,
  CommentFeed,
  CommentPayload,
  Like,
  MessageResponse,
  Post,
  PostFeed,
  PostPayload,
  RegisterPayload,
  RegisterResponse,
  TokenResponse,
  UpdateUserPayload,
  UploadResponse,
  User,
  UsersWhoLiked,
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

type RequestOptions = {
  method?: string;
  token?: string | null;
  body?: BodyInit | object;
  headers?: HeadersInit;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  let body: BodyInit | undefined;

  if (options.body instanceof FormData || options.body instanceof URLSearchParams || typeof options.body === "string") {
    body = options.body;
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body,
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "detail" in data
        ? String(data.detail)
        : response.statusText || "Request failed";
    throw new ApiError(message, response.status);
  }

  return data as T;
}

function normalizeListResponse<T>(data: T[] | { value?: T[] }) {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === "object" && "value" in data && Array.isArray(data.value)) {
    return data.value;
  }

  return [];
}

export const api = {
  login(username: string, password: string) {
    const form = new URLSearchParams();
    form.set("username", username);
    form.set("password", password);

    return request<TokenResponse>("/login", {
      method: "POST",
      body: form,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  },

  register(payload: RegisterPayload) {
    return request<RegisterResponse>("/register/", {
      method: "POST",
      body: payload,
    });
  },

  getMe(token: string) {
    return request<User>("/me/", { token });
  },

  updateUserData(payload: UpdateUserPayload, token: string) {
    return request<User>("/edit-user-data/", {
      method: "PATCH",
      token,
      body: payload,
    });
  },

  getPosts(skip = 0, limit = 10) {
    return request<PostFeed[]>(`/posts/?skip=${skip}&limit=${limit}`);
  },

  getUserPosts(userId: number, skip = 0, limit = 10) {
    return request<PostFeed[]>(`/user-posts/${userId}?skip=${skip}&limit=${limit}`);
  },

  getPost(postId: number) {
    return request<PostFeed | null>(`/get-post/${postId}`);
  },

  createPost(payload: PostPayload, token: string) {
    return request<Post>("/post/", {
      method: "POST",
      token,
      body: payload,
    });
  },

  updatePost(postId: number, payload: PostPayload, token: string) {
    return request<Post>(`/update-post/${postId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },

  deletePost(postId: number, token: string) {
    return request<MessageResponse>(`/delete-post/${postId}`, {
      method: "DELETE",
      token,
    });
  },

  getComments(postId: number) {
    return request<CommentFeed[]>(`/comments/${postId}`);
  },

  getUsersWhoLikedPost(postId: number) {
    return request<UsersWhoLiked[] | { value?: UsersWhoLiked[] }>(`/users-who-liked-post/${postId}`).then(normalizeListResponse);
  },

  getUsersWhoLikedComment(commentId: number) {
    return request<UsersWhoLiked[] | { value?: UsersWhoLiked[] }>(`/users-who-liked-comment/${commentId}`).then(normalizeListResponse);
  },

  createComment(postId: number, payload: CommentPayload, token: string) {
    return request<Comment>(`/comment/${postId}`, {
      method: "POST",
      token,
      body: payload,
    });
  },

  editComment(commentId: number, content: string, token: string) {
    const query = new URLSearchParams({ content });
    return request<Comment>(`/edit-comment/${commentId}?${query.toString()}`, {
      method: "PATCH",
      token,
    });
  },

  deleteComment(commentId: number, token: string) {
    return request<MessageResponse>(`/delete-comment/${commentId}`, {
      method: "DELETE",
      token,
    });
  },

  likePost(postId: number, token: string) {
    return request<Like>(`/like-post/${postId}`, {
      method: "POST",
      token,
    });
  },

  unlikePost(postId: number, token: string) {
    return request<MessageResponse>(`/delete-like-post/${postId}`, {
      method: "DELETE",
      token,
    });
  },

  likeComment(commentId: number, token: string) {
    return request<Like>(`/like-comment/${commentId}`, {
      method: "POST",
      token,
    });
  },

  unlikeComment(commentId: number, token: string) {
    return request<MessageResponse>(`/delete-like-comment/${commentId}`, {
      method: "DELETE",
      token,
    });
  },

  uploadFile(file: File, folder: "avatars" | "posts") {
    const form = new FormData();
    form.set("file", file);
    form.set("folder", folder);

    return request<UploadResponse>("/__uploads", {
      method: "POST",
      body: form,
    });
  },
};
