import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PostCard } from "../components/PostCard";
import { UserAvatar } from "../components/UserAvatar";
import { api, ApiError } from "../lib/api";
import type { PostFeed } from "../lib/types";

export function UserPostsPage() {
  const params = useParams();
  const userId = Number(params.userId);
  const [posts, setPosts] = useState<PostFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(userId)) {
      setError("Invalid user id.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadPosts() {
      setLoading(true);
      setError(null);

      try {
        const result = await api.getUserPosts(userId);
        if (!cancelled) {
          setPosts(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not load this user's posts.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPosts();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const author = posts[0];

  return (
    <section className="post-page">
      <section className="profile-panel user-profile-panel">
        <div className="user-profile-heading">
          <UserAvatar name={author?.user_name ?? "User"} photoPath={author?.user_photo} size="profile" />
          <div>
            <p className="eyebrow">Author</p>
            <h1>{author?.user_name ?? `User ${Number.isFinite(userId) ? userId : ""}`}</h1>
            <p className="helper-text">{loading ? "Loading author posts..." : `${posts.length} published posts`}</p>
          </div>
        </div>
      </section>

      <section className="content-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Archive</p>
            <h2>Posts by this author</h2>
          </div>
          <Link className="ghost-button" to="/">
            Back to feed
          </Link>
        </div>

        {loading ? <div className="panel-card">Loading posts...</div> : null}
        {error ? <div className="panel-card error-card">{error}</div> : null}
        {!loading && !error && posts.length === 0 ? <div className="panel-card">This user has not published anything yet.</div> : null}

        <div className="post-stack">
          {posts.map((post) => (
            <PostCard key={post.post_id} post={post} />
          ))}
        </div>
      </section>
    </section>
  );
}
