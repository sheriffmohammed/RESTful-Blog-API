const TOKEN_KEY = "blogging_api_token";
const REFRESH_TOKEN_KEY = "blogging_refresh_token";
const HIDDEN_POSTS_KEY = "blogging_hidden_posts";
const LIKED_POSTS_KEY = "blogging_liked_posts";
const LIKED_COMMENTS_KEY = "blogging_liked_comments";
const THEME_KEY = "blogging_theme";
const THEME_VERSION_KEY = "blogging_theme_version";
const CURRENT_THEME_VERSION = "2";

export type ThemeMode = "light" | "oceanic" | "dark" | "cyberpunk";

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getStoredRefreshToken() {
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setStoredRefreshToken(token: string) {
  window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function setStoredTokens(accessToken: string, refreshToken: string) {
  setStoredToken(accessToken);
  setStoredRefreshToken(refreshToken);
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
  const version = window.localStorage.getItem(THEME_VERSION_KEY);

  if (value === "dark" && version !== CURRENT_THEME_VERSION) {
    return "oceanic";
  }

  return value === "light" || value === "oceanic" || value === "dark" || value === "cyberpunk" ? value : null;
}

export function setStoredTheme(theme: ThemeMode) {
  window.localStorage.setItem(THEME_KEY, theme);
  window.localStorage.setItem(THEME_VERSION_KEY, CURRENT_THEME_VERSION);
}
