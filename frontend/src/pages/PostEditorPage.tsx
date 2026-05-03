import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ImageUploadField } from "../components/ImageUploadField";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

export function PostEditorPage({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const params = useParams();
  const { token, currentUser, ready } = useAuth();
  const [content, setContent] = useState("");
  const [photoPath, setPhotoPath] = useState("");
  const [loading, setLoading] = useState(mode === "edit");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !params.postId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadPost() {
      setLoading(true);
      setError(null);

      try {
        const post = await api.getPost(Number(params.postId));
        if (!cancelled) {
          if (!post) {
            setError("Post not found.");
            return;
          }

          setContent(post.content);
          setPhotoPath(post.photo_path ?? "");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not load post.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPost();

    return () => {
      cancelled = true;
    };
  }, [mode, params.postId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setError("You need to log in first.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (mode === "edit" && params.postId) {
        const updated = await api.updatePost(Number(params.postId), { content, photo_path: photoPath || null }, token);
        navigate(`/posts/${updated.post_id}`);
      } else {
        const created = await api.createPost({ content, photo_path: photoPath || null }, token);
        navigate(`/posts/${created.post_id}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your post.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return <div className="panel-card">Checking your session...</div>;
  }

  if (!currentUser) {
    return (
      <div className="panel-card">
        You need an account to write posts. <Link to="/login">Login here</Link>.
      </div>
    );
  }

  return (
    <section className="editor-layout">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{mode === "edit" ? "Revise your story" : "New story"}</p>
          <h1>{mode === "edit" ? "Edit post" : "Create a post"}</h1>
        </div>
      </div>

      <form className="panel-card editor-card" onSubmit={handleSubmit}>
        <ImageUploadField
          currentPath={photoPath || null}
          folder="posts"
          hint="Upload a cover image and the frontend will store it in the local project for now."
          label="Cover image"
          onUploaded={setPhotoPath}
        />

        <label className="field">
          <span>Cover image path</span>
          <input value={photoPath} onChange={(event) => setPhotoPath(event.target.value)} placeholder="/images/post-cover.png" />
        </label>

        <label className="field">
          <span>Content</span>
          <textarea rows={14} value={content} onChange={(event) => setContent(event.target.value)} required />
        </label>

        {loading ? <div className="inline-card">Loading post...</div> : null}
        {error ? <div className="error-card inline-card">{error}</div> : null}

        <div className="action-row">
          <button className="primary-button" disabled={submitting || loading} type="submit">
            {submitting ? "Saving..." : mode === "edit" ? "Update post" : "Publish post"}
          </button>
        </div>
      </form>
    </section>
  );
}
