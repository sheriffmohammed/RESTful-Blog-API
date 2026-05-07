import { useEffect, useState } from "react";

type UserAvatarProps = {
  name: string;
  photoPath: string | null | undefined;
  size?: "compact" | "profile";
};

function hasUsablePhoto(photoPath: string | null | undefined) {
  const value = photoPath?.trim();
  return Boolean(value && value !== "null" && value !== "undefined");
}

export function UserAvatar({ name, photoPath, size = "compact" }: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const className = size === "profile" ? "avatar-preview" : "author-avatar";
  const fallbackClassName = size === "profile" ? "avatar-preview default-avatar-preview" : "author-icon";

  useEffect(() => {
    setImageFailed(false);
  }, [photoPath]);

  if (hasUsablePhoto(photoPath) && !imageFailed) {
    return <img alt={name} className={className} onError={() => setImageFailed(true)} src={photoPath!.trim()} />;
  }

  return <span aria-label={`${name} default profile image`} className={fallbackClassName} role="img" />;
}
