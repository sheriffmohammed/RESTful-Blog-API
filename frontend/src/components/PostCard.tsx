import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { getFeedScope, getLikedPosts, setPostLiked } from "../lib/storage";
import type { PostFeed, UsersWhoLiked } from "../lib/types";
import { ActionMenu } from "./ActionMenu";
import { AuthorLink } from "./AuthorLink";
import { LikesDialog, type LikesDialogAnchor } from "./LikesDialog";

function formatStamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function getStoryTitle(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "Untitled post";
  }

  return normalized.length > 48 ? `${normalized.slice(0, 48)}...` : normalized;
}

function SparkIcon() {
  return (
    <svg aria-hidden="true" className="reaction-icon" viewBox="0 0 24 24">
      <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2Z" fill="currentColor" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg aria-hidden="true" className="reaction-icon" viewBox="0 0 24 24">
      <path
        d="M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 17.5H10l-4.5 3v-3H5A1.5 1.5 0 0 1 3.5 16V8A1.5 1.5 0 0 1 5 6.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function PostCard({
  post,
  editable = false,
  onDelete,
  onHide,
}: {
  post: PostFeed;
  editable?: boolean;
  onDelete?: (postId: number) => void;
  onHide?: (postId: number) => void;
}) {
  const navigate = useNavigate();
  const { token, currentUser } = useAuth();
  const [postState, setPostState] = useState(post);
  const [likesOpen, setLikesOpen] = useState(false);
  const [likesLoading, setLikesLoading] = useState(false);
  const [likesError, setLikesError] = useState<string | null>(null);
  const [likedUsers, setLikedUsers] = useState<UsersWhoLiked[]>([]);
  const [likesAnchor, setLikesAnchor] = useState<LikesDialogAnchor | null>(null);
  const [liked, setLiked] = useState(false);
  const likeScope = getFeedScope(currentUser?.id);

  useEffect(() => {
    setPostState(post);
  }, [post]);

  useEffect(() => {
    if (post.post_id === null) {
      setLiked(false);
      return;
    }

    setLiked(getLikedPosts(likeScope).includes(post.post_id));
  }, [likeScope, post.post_id]);

  async function handleToggleLike() {
    if (!token || postState.post_id === null) {
      window.alert("Login first to like posts.");
      return;
    }

    try {
      await api.likePost(postState.post_id, token);
      setPostState((value) => ({ ...value, likes_count: value.likes_count + 1 }));
      setLiked(true);
      setPostLiked(likeScope, postState.post_id, true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        try {
          await api.unlikePost(postState.post_id, token);
          setPostState((value) => ({ ...value, likes_count: Math.max(0, value.likes_count - 1) }));
          setLiked(false);
          setPostLiked(likeScope, postState.post_id, false);
          return;
        } catch (unlikeError) {
          window.alert(unlikeError instanceof ApiError ? unlikeError.message : "Could not unlike this post.");
          return;
        }
      }

      window.alert(err instanceof ApiError ? err.message : "Could not like this post.");
    }
  }

  async function handleShowLikes(anchorRect: LikesDialogAnchor) {
    if (postState.post_id === null) {
      return;
    }

    setLikesAnchor(anchorRect);
    setLikesOpen(true);
    setLikesLoading(true);
    setLikesError(null);
    setLikedUsers([]);

    try {
      const result = await api.getUsersWhoLikedPost(postState.post_id);
      setLikedUsers(result);
    } catch (err) {
      setLikesError(err instanceof ApiError ? err.message : "Could not load likes.");
    } finally {
      setLikesLoading(false);
    }
  }

  const excerpt = postState.content.length > 220 ? `${postState.content.slice(0, 220)}...` : postState.content;
  const title = getStoryTitle(postState.content);
  const menuItems = [
    ...(editable && postState.post_id !== null
      ? [
          {
            label: "Edit post",
            onSelect: () => navigate(`/posts/${postState.post_id}/edit`),
          },
        ]
      : []),
    ...(onHide && postState.post_id !== null
      ? [
          {
            label: "Hide from feed",
            onSelect: () => onHide(postState.post_id!),
          },
        ]
      : []),
    ...(onDelete && postState.post_id !== null
      ? [
          {
            label: "Delete post",
            onSelect: () => onDelete(postState.post_id!),
            tone: "danger" as const,
          },
        ]
      : []),
  ];

  return (
    <>
      <article className="post-card">
        <div className="post-meta post-meta-top">
          <AuthorLink userId={postState.user_id} userName={postState.user_name} userPhoto={postState.user_photo} />
          <div className="meta-cluster">
            <button
              className="inline-pill inline-button"
              onClick={(event) =>
                void handleShowLikes({
                  top: event.currentTarget.getBoundingClientRect().top,
                  left: event.currentTarget.getBoundingClientRect().left,
                  bottom: event.currentTarget.getBoundingClientRect().bottom,
                  right: event.currentTarget.getBoundingClientRect().right,
                  width: event.currentTarget.getBoundingClientRect().width,
                  height: event.currentTarget.getBoundingClientRect().height,
                })
              }
              type="button"
            >
              {postState.likes_count} likes
            </button>
            <span>{formatStamp(postState.created_at)}</span>
            {menuItems.length > 0 ? <ActionMenu items={menuItems} /> : null}
          </div>
        </div>

        <h2 className="post-title">
          <Link to={`/posts/${postState.post_id}`}>{title}</Link>
        </h2>
        {postState.photo_path ? <img alt="" className="post-image" src={postState.photo_path} /> : null}
        <p className="post-excerpt">{excerpt}</p>

        <div className="post-actions compact-actions">
          <button
            aria-label={liked ? "Unlike post" : "Like post"}
            aria-pressed={liked}
            className={`icon-button reaction-button ${liked ? "reaction-button-active" : ""}`}
            onClick={() => void handleToggleLike()}
            type="button"
          >
            <SparkIcon />
          </button>
          <Link aria-label="Open comments" className="icon-button reaction-button" to={`/posts/${postState.post_id}`}>
            <ChatIcon />
          </Link>
        </div>
      </article>

      <LikesDialog
        anchorRect={likesAnchor}
        error={likesError}
        loading={likesLoading}
        onClose={() => {
          setLikesOpen(false);
          setLikesAnchor(null);
        }}
        open={likesOpen}
        title="People who liked this post"
        users={likedUsers}
      />
    </>
  );
}
