import { useEffect, useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { getStoredTheme, setStoredTheme, type ThemeMode } from "../lib/storage";

function getInitialTheme(): ThemeMode {
  const storedTheme = getStoredTheme();

  if (storedTheme) {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function AppShell({ children }: { children: ReactNode }) {
  const { currentUser, logout, ready } = useAuth();
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    setStoredTheme(theme);
  }, [theme]);

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <div className="app-frame">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />
      <header className="site-header">
        <div>
          <NavLink to="/" className="brand-mark">
            Inkline
          </NavLink>
          <p className="brand-subtitle">Editorial blogging frontend for your FastAPI backend.</p>
        </div>

        <nav className="main-nav">
          <NavLink to="/" className="nav-link">
            Feed
          </NavLink>
          <NavLink to="/posts/new" className="nav-link">
            New Post
          </NavLink>
          <NavLink to="/me" className="nav-link">
            My Space
          </NavLink>
          <button
            aria-label={`Switch to ${nextTheme} theme`}
            className="theme-toggle"
            onClick={() => setTheme(nextTheme)}
            title={`Switch to ${nextTheme} theme`}
            type="button"
          >
            <span className="theme-toggle-track" aria-hidden="true">
              <span className="theme-toggle-icon" />
            </span>
          </button>
          {currentUser ? (
            <button className="ghost-button" onClick={logout} type="button">
              Log out
            </button>
          ) : (
            <>
              <NavLink to="/login" className="nav-link">
                Login
              </NavLink>
              <NavLink to="/register" className="primary-button nav-button">
                Register
              </NavLink>
            </>
          )}
        </nav>
      </header>

      <main className="page-shell">
        {currentUser ? (
          <section className="status-banner">
            <span className="status-dot" />
            Signed in as <strong>{currentUser.user_name}</strong>
          </section>
        ) : ready ? (
          <section className="status-banner muted-banner">Browse publicly or sign in to publish and interact.</section>
        ) : (
          <section className="status-banner muted-banner">Restoring your session...</section>
        )}
        {children}
      </main>
    </div>
  );
}
