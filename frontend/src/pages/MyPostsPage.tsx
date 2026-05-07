import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ImageUploadField } from "../components/ImageUploadField";
import { PostCard } from "../components/PostCard";
import { UserAvatar } from "../components/UserAvatar";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { PostFeed } from "../lib/types";

export function MyPostsPage() {
  const { currentUser, token, ready, refreshUser } = useAuth();
  const [posts, setPosts] = useState<PostFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [profileForm, setProfileForm] = useState({
    user_name: "",
    email: "",
    password: "",
    photo_path: "",
  });

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setProfileForm({
      user_name: currentUser.user_name,
      email: currentUser.email,
      password: "",
      photo_path: currentUser.photo_path ?? "",
    });
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const userId = currentUser.id;

    let cancelled = false;

    async function loadPosts() {
      setLoading(true);
      setError(null);

      try {
        const result = await api.getUserPosts(userId ?? 0);
        if (!cancelled) {
          setPosts(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not load your posts.");
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
  }, [currentUser]);

  async function handleDelete(postId: number | null) {
    if (!token || postId === null) {
      return;
    }

    const confirmed = window.confirm("Delete this post?");
    if (!confirmed) {
      return;
    }

    try {
      const result = await api.deletePost(postId, token);
      setPosts((items) => items.filter((item) => item.post_id !== postId));
      setMessage(result.msg);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete the post.");
    }
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !currentUser) {
      setError("You need to log in first.");
      return;
    }

    setSavingProfile(true);
    setError(null);
    setMessage(null);

    try {
      const currentPhotoPath = currentUser.photo_path || null;
      const payload: {
        user_name?: string;
        email?: string;
        password?: string;
        photo_path?: string | null;
      } = {};

      if (profileForm.user_name && profileForm.user_name !== currentUser.user_name) {
        payload.user_name = profileForm.user_name;
      }

      if (profileForm.email && profileForm.email !== currentUser.email) {
        payload.email = profileForm.email;
      }

      if (profileForm.password.trim()) {
        payload.password = profileForm.password;
      }

      if ((profileForm.photo_path || null) !== currentPhotoPath) {
        payload.photo_path = profileForm.photo_path || null;
      }

      if (Object.keys(payload).length === 0) {
        setMessage("No profile changes to save.");
        setSavingProfile(false);
        return;
      }

      await api.updateUserData(payload, token);
      await refreshUser();
      setProfileForm((value) => ({ ...value, password: "" }));
      setMessage("Profile updated successfully.");
      setShowProfileEditor(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update your profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  if (!ready) {
    return <div className="panel-card">Checking your account...</div>;
  }

  if (!currentUser) {
    return (
      <div className="panel-card">
        Log in to see your profile and posts. <Link to="/login">Go to login</Link>.
      </div>
    );
  }

  return (
    <section className="page-grid">
      <aside className="profile-panel">
        <p className="eyebrow">Profile</p>
        <h1>{currentUser.user_name}</h1>
        <p>{currentUser.email}</p>
        <div className="profile-visual">
          <UserAvatar name={currentUser.user_name} photoPath={currentUser.photo_path} size="profile" />
        </div>
        <div className="split-actions">
          <Link className="primary-button split-button" to="/posts/new">
            Write a new post
          </Link>
          <button className="ghost-button split-button" onClick={() => setShowProfileEditor((value) => !value)} type="button">
            {showProfileEditor ? "Hide account edit" : "Edit your account"}
          </button>
        </div>

        {showProfileEditor ? (
          <form className="panel-card profile-form" onSubmit={handleProfileSubmit}>
            <ImageUploadField
              currentPath={profileForm.photo_path || null}
              folder="avatars"
              hint="Uploads are saved into the frontend project for local development."
              label="Profile image"
              onUploaded={(path) => setProfileForm((value) => ({ ...value, photo_path: path }))}
            />

            <label className="field">
              <span>Username</span>
              <input
                onChange={(event) => setProfileForm((value) => ({ ...value, user_name: event.target.value }))}
                value={profileForm.user_name}
              />
            </label>

            <label className="field">
              <span>Email</span>
              <input
                onChange={(event) => setProfileForm((value) => ({ ...value, email: event.target.value }))}
                type="email"
                value={profileForm.email}
              />
            </label>

            <label className="field">
              <span>New password</span>
              <input
                minLength={8}
                onChange={(event) => setProfileForm((value) => ({ ...value, password: event.target.value }))}
                placeholder="Leave blank to keep your current password"
                type="password"
                value={profileForm.password}
              />
            </label>

            <button className="primary-button" disabled={savingProfile} type="submit">
              {savingProfile ? "Saving profile..." : "Save profile"}
            </button>
          </form>
        ) : null}
      </aside>

      <section className="content-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Ownership</p>
            <h2>Your published posts</h2>
          </div>
        </div>

        {message ? <div className="panel-card success-card">{message}</div> : null}
        {error ? <div className="panel-card error-card">{error}</div> : null}
        {loading ? <div className="panel-card">Loading your posts...</div> : null}
        {!loading && posts.length === 0 ? <div className="panel-card">You have not published anything yet.</div> : null}

        <div className="post-stack">
          {posts.map((post) => (
            <div key={post.post_id} className="owned-post">
              <PostCard editable onDelete={(postId) => void handleDelete(postId)} post={post} />
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
