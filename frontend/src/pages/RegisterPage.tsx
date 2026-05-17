import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ImageUploadField } from "../components/ImageUploadField";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    user_name: "",
    email: "",
    password: "",
    photo_path: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await register({
        ...form,
        photo_path: form.photo_path || null,
      });
      navigate("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-layout">
      <div className="auth-intro">
        <p className="eyebrow">Join the space</p>
        <h1>Create an account for publishing, comments, and reactions.</h1>
      </div>

      <form className="panel-card auth-card" onSubmit={handleSubmit}>
        <label className="field">
          <span>Username</span>
          <input value={form.user_name} onChange={(event) => setForm((value) => ({ ...value, user_name: event.target.value }))} required />
        </label>

        <label className="field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} required />
        </label>

        <label className="field">
          <span>Password</span>
          <input type="password" minLength={8} value={form.password} onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))} required />
        </label>

        <div className="register-upload-field">
          <ImageUploadField
            currentPath={form.photo_path || null}
            folder="avatars"
            hint="This saves the image into the project during local development."
            label="Profile image"
            onUploaded={(path) => setForm((value) => ({ ...value, photo_path: path }))}
          />
        </div>

        {error ? <div className="error-card inline-card">{error}</div> : null}

        <button className="primary-button" disabled={submitting} type="submit">
          {submitting ? "Creating..." : "Create account"}
        </button>

        <p className="helper-text">
          Already registered? <Link to="/login">Go to login</Link>.
        </p>
      </form>
    </section>
  );
}
