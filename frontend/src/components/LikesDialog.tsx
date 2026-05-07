import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { UsersWhoLiked } from "../lib/types";
import { AuthorLink } from "./AuthorLink";

export type LikesDialogAnchor = {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
};

function getDialogStyle(anchorRect: LikesDialogAnchor | null | undefined): CSSProperties {
  if (typeof window === "undefined") {
    return {};
  }

  const viewportPadding = 16;
  const gap = 10;
  const maxWidth = 512;
  const width = Math.min(maxWidth, window.innerWidth - viewportPadding * 2);

  if (!anchorRect) {
    return {
      left: Math.max(viewportPadding, (window.innerWidth - width) / 2),
      top: viewportPadding,
      width,
      maxHeight: window.innerHeight - viewportPadding * 2,
    };
  }

  const left = Math.min(
    Math.max(viewportPadding, anchorRect.left),
    Math.max(viewportPadding, window.innerWidth - width - viewportPadding),
  );
  const availableBelow = window.innerHeight - anchorRect.bottom - viewportPadding - gap;
  const availableAbove = anchorRect.top - viewportPadding - gap;
  const prefersBelow = availableBelow >= 220 || availableBelow >= availableAbove;
  const maxHeight = Math.max(220, prefersBelow ? availableBelow : availableAbove);
  const top = prefersBelow
    ? Math.max(viewportPadding, anchorRect.bottom + gap)
    : Math.max(viewportPadding, anchorRect.top - maxHeight - gap);

  return {
    left,
    top,
    width,
    maxHeight,
  };
}

export function LikesDialog({
  title,
  open,
  loading,
  error,
  users,
  anchorRect,
  onClose,
}: {
  title: string;
  open: boolean;
  loading: boolean;
  error: string | null;
  users: UsersWhoLiked[];
  anchorRect?: LikesDialogAnchor | null;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return createPortal(
    <div className="dialog-backdrop" onClick={onClose} role="presentation">
      <div
        aria-modal="true"
        className="dialog-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        style={getDialogStyle(anchorRect)}
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">Engagement</p>
            <h3>{title}</h3>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            x
          </button>
        </div>

        {loading ? <div className="inline-card">Loading likes...</div> : null}
        {error ? <div className="error-card inline-card">{error}</div> : null}
        {!loading && !error && users.length === 0 ? <div className="inline-card">No likes yet.</div> : null}

        <div className="likes-list">
          {users.map((user) => (
            <div className="liked-user-row" key={user.user_id}>
              <AuthorLink userId={user.user_id} userName={user.user_name} userPhoto={user.user_photo} />
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
