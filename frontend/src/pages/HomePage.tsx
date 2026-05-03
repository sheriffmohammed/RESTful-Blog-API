import { useEffect, useState } from "react";
import { PostCard } from "../components/PostCard";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { getFeedScope, getHiddenPosts, hidePost } from "../lib/storage";
import type { PostFeed } from "../lib/types";

const PAGE_SIZE = 6;

export function HomePage() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<PostFeed[]>([]);
  const [hiddenPostIds, setHiddenPostIds] = useState<number[]>([]);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scope = getFeedScope(currentUser?.id);

  useEffect(() => {
    setHiddenPostIds(getHiddenPosts(scope));
  }, [scope]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await api.getPosts(skip, PAGE_SIZE);
        if (!cancelled) {
          setPosts(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not load posts.");
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
  }, [skip]);

  function handleHidePost(postId: number) {
    hidePost(scope, postId);
    setHiddenPostIds((value) => (value.includes(postId) ? value : [...value, postId]));
  }

  const visiblePosts = posts.filter((post) => !hiddenPostIds.includes(post.post_id ?? -1));

  return (
    <section className="page-grid">
      <section className="hero-panel">
        <p className="eyebrow">Frontend prototype</p>
        <h1>Bring your API to life with a clean editorial reading experience.</h1>
        <p className="hero-copy">
          This feed talks directly to your FastAPI backend with native <code>fetch</code>, using the exact routes you
          already documented.
        </p>
        <div className="hero-stats">
          <div>
            <strong>{visiblePosts.length}</strong>
            <span>visible posts</span>
          </div>
          <div>
            <strong>{skip / PAGE_SIZE + 1}</strong>
            <span>current page</span>
          </div>
          <div>
            <strong>JWT</strong>
            <span>auth ready</span>
          </div>
        </div>
      </section>

      <section className="content-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Latest stories</p>
            <h2>Posts feed</h2>
          </div>
          <div className="pager">
            <button className="ghost-button" disabled={skip === 0} onClick={() => setSkip((value) => Math.max(0, value - PAGE_SIZE))}>
              Previous
            </button>
            <button className="ghost-button" disabled={posts.length < PAGE_SIZE} onClick={() => setSkip((value) => value + PAGE_SIZE)}>
              Next
            </button>
          </div>
        </div>

        {loading ? <div className="panel-card">Loading posts...</div> : null}
        {error ? <div className="panel-card error-card">{error}</div> : null}
        {!loading && !error && visiblePosts.length === 0 ? <div className="panel-card">No posts left in this view.</div> : null}

        <div className="post-stack">
          {visiblePosts.map((post) => (
            <PostCard key={post.post_id} onHide={handleHidePost} post={post} />
          ))}
        </div>
      </section>
    </section>
  );
}
