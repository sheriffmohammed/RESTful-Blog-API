import { Link } from "react-router-dom";

export function AuthPromptDialog({
  open,
  onClose,
  message = "Sign in to like posts and join the conversation.",
}: {
  open: boolean;
  onClose: () => void;
  message?: string;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="auth-prompt-backdrop" onClick={onClose} role="presentation">
      <div aria-modal="true" className="auth-prompt-card" onClick={(event) => event.stopPropagation()} role="dialog">
        <div className="auth-prompt-header">
          <div>
            <p className="eyebrow">Account needed</p>
            <h3>Like this?</h3>
          </div>
          <button aria-label="Close" className="auth-prompt-close" onClick={onClose} type="button">
            x
          </button>
        </div>
        <p className="helper-text">{message}</p>
        <div className="auth-prompt-actions">
          <Link className="primary-button split-button" onClick={onClose} to="/login">
            Login
          </Link>
          <Link className="ghost-button split-button" onClick={onClose} to="/register">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
