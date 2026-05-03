import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(username, password);
      navigate("/me");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-layout">
      <div className="auth-intro">
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in and manage your stories.</h1>
        <p>Use your existing API login route. The app stores the bearer token locally and restores your profile via <code>/me/</code>.</p>
      </div>

      <form className="panel-card auth-card" onSubmit={handleSubmit}>
        <label className="field">
          <span>Username</span>
          <input value={username} onChange={(event) => setUsername(event.target.value)} required />
        </label>

        <label className="field">
          <span>Password</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>

        {error ? <div className="error-card inline-card">{error}</div> : null}

        <button className="primary-button" disabled={submitting} type="submit">
          {submitting ? "Signing in..." : "Login"}
        </button>

        <p className="helper-text">
          Need an account? <Link to="/register">Create one</Link>.
        </p>
      </form>
    </section>
  );
}
