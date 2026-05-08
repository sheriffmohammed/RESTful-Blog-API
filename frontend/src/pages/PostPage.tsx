import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ActionMenu } from "../components/ActionMenu";
import { AuthorLink } from "../components/AuthorLink";
import { LikesDialog, type LikesDialogAnchor } from "../components/LikesDialog";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { getFeedScope, getLikedComments, getLikedPosts, hidePost, setCommentLiked, setPostLiked } from "../lib/storage";
import type { CommentFeed, PostFeed, UsersWhoLiked } from "../lib/types";

function formatStamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function getPostHeading(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "Untitled post";
  }

  return normalized.length > 64 ? `${normalized.slice(0, 64)}...` : normalized;
}

function LikeIcon() {
  return (
    <svg aria-hidden="true" className="reaction-icon" viewBox="0 0 24 24">
      <path
        d="M12 20.4 4.9 13.8C3.2 12.2 3 9.5 4.5 7.7c1.6-1.9 4.5-1.9 6.1-.1L12 9.1l1.4-1.5c1.6-1.8 4.5-1.8 6.1.1 1.5 1.8 1.3 4.5-.4 6.1L12 20.4Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

type LikesViewState = {
  open: boolean;
  title: string;
  loading: boolean;
  error: string | null;
  users: UsersWhoLiked[];
  anchorRect: LikesDialogAnchor | null;
};

const defaultLikesView: LikesViewState = {
  open: false,
  title: "",
  loading: false,
  error: null,
  users: [],
  anchorRect: null,
};

export function PostPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { currentUser, token, ready } = useAuth();
  const [post, setPost] = useState<PostFeed | null>(null);
  const [comments, setComments] = useState<CommentFeed[]>([]);
  const [draftComment, setDraftComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [likesView, setLikesView] = useState<LikesViewState>(defaultLikesView);
  const [likedPostIds, setLikedPostIds] = useState<number[]>([]);
  const [likedCommentIds, setLikedCommentIds] = useState<number[]>([]);

  const postId = Number(params.postId);
  const scope = getFeedScope(currentUser?.id);

  useEffect(() => {
    setLikedPostIds(getLikedPosts(scope));
    setLikedCommentIds(getLikedComments(scope));
  }, [scope]);

  async function refreshPost() {
    try {
      const result = await api.getPost(postId);
      setPost(result);
      if (!result) {
        setError("Post not found.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not refresh the post.");
    }
  }

  async function refreshComments() {
    try {
      const result = await api.getComments(postId);
      setComments(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not refresh comments.");
    }
  }

  useEffect(() => {
    if (!Number.isFinite(postId)) {
      setError("Invalid post id.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [postResult, commentResult] = await Promise.all([api.getPost(postId), api.getComments(postId)]);
        if (!cancelled) {
          setPost(postResult);
          setComments(commentResult);
          if (!postResult) {
            setError("Post not found.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not load the post.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [postId]);

  async function openPostLikes(anchorRect: LikesDialogAnchor) {
    if (!post?.post_id) {
      return;
    }

    setLikesView({
      open: true,
      title: "People who liked this post",
      loading: true,
      error: null,
      users: [],
      anchorRect,
    });

    try {
      const result = await api.getUsersWhoLikedPost(post.post_id);
      setLikesView({
        open: true,
        title: "People who liked this post",
        loading: false,
        error: null,
        users: result,
        anchorRect,
      });
    } catch (err) {
      setLikesView({
        open: true,
        title: "People who liked this post",
        loading: false,
        error: err instanceof ApiError ? err.message : "Could not load likes.",
        users: [],
        anchorRect,
      });
    }
  }

  async function openCommentLikes(commentId: number, userName: string, anchorRect: LikesDialogAnchor) {
    setLikesView({
      open: true,
      title: `People who liked ${userName}'s comment`,
      loading: true,
      error: null,
      users: [],
      anchorRect,
    });

    try {
      const result = await api.getUsersWhoLikedComment(commentId);
      setLikesView({
        open: true,
        title: `People who liked ${userName}'s comment`,
        loading: false,
        error: null,
        users: result,
        anchorRect,
      });
    } catch (err) {
      setLikesView({
        open: true,
        title: `People who liked ${userName}'s comment`,
        loading: false,
        error: err instanceof ApiError ? err.message : "Could not load likes.",
        users: [],
        anchorRect,
      });
    }
  }

  async function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setError("Login first to comment.");
      return;
    }

    try {
      await api.createComment(postId, { content: draftComment }, token);
      setDraftComment("");
      setFeedback("Comment added.");
      setError(null);
      await refreshComments();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add comment.");
    }
  }

  async function handleTogglePostLike() {
    if (!token || !post?.post_id) {
      setError("Login first to like posts.");
      return;
    }

    try {
      await api.likePost(post.post_id, token);
      setPostLiked(scope, post.post_id, true);
      setLikedPostIds((value) => (value.includes(post.post_id!) ? value : [...value, post.post_id!]));
      await refreshPost();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        try {
          await api.unlikePost(post.post_id, token);
          setPostLiked(scope, post.post_id, false);
          setLikedPostIds((value) => value.filter((valueId) => valueId !== post.post_id));
          await refreshPost();
          return;
        } catch (unlikeError) {
          setError(unlikeError instanceof ApiError ? unlikeError.message : "Could not unlike this post.");
          return;
        }
      }

      setError(err instanceof ApiError ? err.message : "Could not like this post.");
    }
  }

  async function handleToggleCommentLike(commentId: number | null) {
    if (!token || commentId === null) {
      setError("Login first to like comments.");
      return;
    }

    try {
      await api.likeComment(commentId, token);
      setCommentLiked(scope, commentId, true);
      setLikedCommentIds((value) => (value.includes(commentId) ? value : [...value, commentId]));
      await refreshComments();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        try {
          await api.unlikeComment(commentId, token);
          setCommentLiked(scope, commentId, false);
          setLikedCommentIds((value) => value.filter((valueId) => valueId !== commentId));
          await refreshComments();
          return;
        } catch (unlikeError) {
          setError(unlikeError instanceof ApiError ? unlikeError.message : "Could not unlike this comment.");
          return;
        }
      }

      setError(err instanceof ApiError ? err.message : "Could not like this comment.");
    }
  }

  async function handleCommentDelete(commentId: number | null) {
    if (!token || commentId === null) {
      return;
    }

    try {
      const result = await api.deleteComment(commentId, token);
      setFeedback(result.msg);
      setError(null);
      await refreshComments();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete comment.");
    }
  }

  async function handleCommentUpdate(commentId: number | null) {
    if (!token || commentId === null) {
      return;
    }

    try {
      await api.editComment(commentId, editingCommentText, token);
      setEditingCommentId(null);
      setEditingCommentText("");
      setFeedback("Comment updated.");
      setError(null);
      await refreshComments();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not edit comment.");
    }
  }

  async function handleDeletePost() {
    if (!token || !post?.post_id) {
      return;
    }

    const confirmed = window.confirm("Delete this post?");
    if (!confirmed) {
      return;
    }

    try {
      await api.deletePost(post.post_id, token);
      navigate("/me");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete post.");
    }
  }

  function handleHidePost() {
    if (!post?.post_id) {
      return;
    }

    hidePost(scope, post.post_id);
    navigate("/");
  }

  if (!ready || loading) {
    return <div className="panel-card">Loading post...</div>;
  }

  if (!post) {
    return <div className="panel-card error-card">{error ?? "Post not found."}</div>;
  }

  const isOwner = currentUser?.id === post.user_id;
  const postLiked = post.post_id !== null && likedPostIds.includes(post.post_id);
  const menuItems = [
    {
      label: "Hide from feed",
      onSelect: handleHidePost,
    },
    ...(isOwner
      ? [
          {
            label: "Edit post",
            onSelect: () => navigate(`/posts/${post.post_id}/edit`),
          },
          {
            label: "Delete post",
            onSelect: () => void handleDeletePost(),
            tone: "danger" as const,
          },
        ]
      : []),
  ];

  return (
    <>
      <section className="post-page">
        <article className="story-panel">
          <div className="story-meta">
            <AuthorLink userId={post.user_id} userName={post.user_name} userPhoto={post.user_photo} />
            <div className="meta-cluster">
              <button
                className="inline-pill inline-button"
                onClick={(event) =>
                  void openPostLikes({
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
                {post.likes_count} likes
              </button>
              <span>{formatStamp(post.modified_at)}</span>
              <ActionMenu items={menuItems} />
            </div>
          </div>
          <h1 className="story-title">{getPostHeading(post.content)}</h1>
          {post.photo_path ? <img alt="" className="story-image" src={post.photo_path} /> : null}
          <p className="story-body">{post.content}</p>

          <div className="action-row compact-actions">
            <button
              aria-label={postLiked ? "Unlike post" : "Like post"}
              aria-pressed={postLiked}
              className={`icon-button reaction-button ${postLiked ? "reaction-button-active" : ""}`}
              onClick={() => void handleTogglePostLike()}
              type="button"
            >
              <LikeIcon />
            </button>
          </div>
        </article>

        <section className="comments-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Discussion</p>
              <h2>Comments</h2>
            </div>
          </div>

          {feedback ? <div className="success-card inline-card">{feedback}</div> : null}
          {error ? <div className="error-card inline-card">{error}</div> : null}

          {currentUser ? (
            <form className="panel-card comment-form" onSubmit={handleCommentSubmit}>
              <label className="field">
                <span>Add a comment</span>
                <textarea rows={4} value={draftComment} onChange={(event) => setDraftComment(event.target.value)} required />
              </label>
              <button className="primary-button" type="submit">
                Publish comment
              </button>
            </form>
          ) : (
            <div className="panel-card">
              <Link to="/login">Login</Link> to join the conversation.
            </div>
          )}

          <div className="comment-stack">
            {comments.length === 0 ? <div className="panel-card">No comments yet.</div> : null}

            {comments.map((comment) => {
              const ownsComment = currentUser?.id === comment.user_id;
              const commentLiked = comment.comment_id !== null && likedCommentIds.includes(comment.comment_id);

              return (
                <article key={comment.comment_id} className="comment-card">
                  <div className="post-meta">
                    <AuthorLink userId={comment.user_id} userName={comment.user_name} userPhoto={comment.user_photo} />
                    <span className="meta-cluster">
                      <button
                        className="inline-pill inline-button"
                        onClick={(event) =>
                          comment.comment_id !== null &&
                          void openCommentLikes(comment.comment_id, comment.user_name, {
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
                        {comment.likes_count} likes
                      </button>
                      <span>{formatStamp(comment.modified_at)}</span>
                    </span>
                  </div>

                  {editingCommentId === comment.comment_id ? (
                    <div className="field">
                      <textarea rows={3} value={editingCommentText} onChange={(event) => setEditingCommentText(event.target.value)} />
                    </div>
                  ) : (
                    <p>{comment.content}</p>
                  )}

                  <div className="action-row compact-actions">
                    <button
                      aria-label={commentLiked ? "Unlike comment" : "Like comment"}
                      aria-pressed={commentLiked}
                      className={`icon-button reaction-button ${commentLiked ? "reaction-button-active" : ""}`}
                      onClick={() => void handleToggleCommentLike(comment.comment_id)}
                      type="button"
                    >
                      <LikeIcon />
                    </button>
                    {ownsComment && editingCommentId !== comment.comment_id ? (
                      <button
                        className="ghost-button"
                        onClick={() => {
                          setEditingCommentId(comment.comment_id);
                          setEditingCommentText(comment.content);
                        }}
                        type="button"
                      >
                        Edit
                      </button>
                    ) : null}
                    {ownsComment && editingCommentId === comment.comment_id ? (
                      <button className="primary-button" onClick={() => void handleCommentUpdate(comment.comment_id)} type="button">
                        Save
                      </button>
                    ) : null}
                    {ownsComment ? (
                      <button className="ghost-button danger-button" onClick={() => void handleCommentDelete(comment.comment_id)} type="button">
                        Delete
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>

      <LikesDialog
        anchorRect={likesView.anchorRect}
        error={likesView.error}
        loading={likesView.loading}
        onClose={() => setLikesView(defaultLikesView)}
        open={likesView.open}
        title={likesView.title}
        users={likesView.users}
      />
    </>
  );
}
