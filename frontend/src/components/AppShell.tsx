import { useEffect, useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { getStoredTheme, setStoredTheme, type ThemeMode } from "../lib/storage";

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "oceanic", label: "Oceanic" },
  { value: "dark", label: "Dark Grey" },
  { value: "cyberpunk", label: "Cyberpunk" },
] satisfies { value: ThemeMode; label: string }[];

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
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const activeTheme = themeOptions.find((option) => option.value === theme) ?? themeOptions[0];

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    setStoredTheme(theme);
  }, [theme]);

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
          <div
            className="theme-menu-shell"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setThemeMenuOpen(false);
              }
            }}
          >
            <button
              aria-expanded={themeMenuOpen}
              aria-haspopup="menu"
              className="theme-menu-button"
              onClick={() => setThemeMenuOpen((open) => !open)}
              title="Choose theme"
              type="button"
            >
              Theme
              <span className="theme-menu-current">{activeTheme.label}</span>
            </button>
            {themeMenuOpen ? (
              <div className="theme-menu-popover" role="menu">
                {themeOptions.map((option) => (
                  <button
                    aria-checked={theme === option.value}
                    className="theme-option"
                    key={option.value}
                    onClick={() => {
                      setTheme(option.value);
                      setThemeMenuOpen(false);
                    }}
                    role="menuitemradio"
                    type="button"
                  >
                    <span className={`theme-swatch theme-swatch-${option.value}`} aria-hidden="true" />
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
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
