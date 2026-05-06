const TOKEN_KEY = "blogging_api_token";
const HIDDEN_POSTS_KEY = "blogging_hidden_posts";
const LIKED_POSTS_KEY = "blogging_liked_posts";
const LIKED_COMMENTS_KEY = "blogging_liked_comments";
const THEME_KEY = "blogging_theme";

export type ThemeMode = "light" | "dark";

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

function readHiddenPostMap() {
  const raw = window.localStorage.getItem(HIDDEN_POSTS_KEY);

  if (!raw) {
    return {} as Record<string, number[]>;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, number[]>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function writeHiddenPostMap(value: Record<string, number[]>) {
  window.localStorage.setItem(HIDDEN_POSTS_KEY, JSON.stringify(value));
}

function readNumberMap(key: string) {
  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return {} as Record<string, number[]>;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, number[]>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function writeNumberMap(key: string, value: Record<string, number[]>) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getFeedScope(userId: number | null | undefined) {
  return userId ? `user:${userId}` : "guest";
}

export function getHiddenPosts(scope: string) {
  return readHiddenPostMap()[scope] ?? [];
}

export function hidePost(scope: string, postId: number) {
  const map = readHiddenPostMap();
  const existing = new Set(map[scope] ?? []);
  existing.add(postId);
  map[scope] = [...existing];
  writeHiddenPostMap(map);
}

export function getLikedPosts(scope: string) {
  return readNumberMap(LIKED_POSTS_KEY)[scope] ?? [];
}

export function setPostLiked(scope: string, postId: number, liked: boolean) {
  const map = readNumberMap(LIKED_POSTS_KEY);
  const existing = new Set(map[scope] ?? []);
  if (liked) {
    existing.add(postId);
  } else {
    existing.delete(postId);
  }
  map[scope] = [...existing];
  writeNumberMap(LIKED_POSTS_KEY, map);
}

export function getLikedComments(scope: string) {
  return readNumberMap(LIKED_COMMENTS_KEY)[scope] ?? [];
}

export function setCommentLiked(scope: string, commentId: number, liked: boolean) {
  const map = readNumberMap(LIKED_COMMENTS_KEY);
  const existing = new Set(map[scope] ?? []);
  if (liked) {
    existing.add(commentId);
  } else {
    existing.delete(commentId);
  }
  map[scope] = [...existing];
  writeNumberMap(LIKED_COMMENTS_KEY, map);
}

export function getStoredTheme(): ThemeMode | null {
  const value = window.localStorage.getItem(THEME_KEY);
  return value === "light" || value === "dark" ? value : null;
}

export function setStoredTheme(theme: ThemeMode) {
  window.localStorage.setItem(THEME_KEY, theme);
}
