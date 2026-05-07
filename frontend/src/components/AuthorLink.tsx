import { Link } from "react-router-dom";
import { UserAvatar } from "./UserAvatar";

type AuthorLinkProps = {
  userId: number | null | undefined;
  userName: string;
  userPhoto: string | null | undefined;
};

export function AuthorLink({ userId, userName, userPhoto }: AuthorLinkProps) {
  if (userId === null || userId === undefined) {
    return (
      <span className="author-chip">
        <UserAvatar name={userName} photoPath={userPhoto} />
        <span>{userName}</span>
      </span>
    );
  }

  return (
    <Link className="author-chip author-link" to={`/users/${userId}`}>
      <UserAvatar name={userName} photoPath={userPhoto} />
      <span>{userName}</span>
    </Link>
  );
}
