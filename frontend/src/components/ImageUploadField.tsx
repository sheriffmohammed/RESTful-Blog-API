import { useId, useState } from "react";
import { api, ApiError } from "../lib/api";

type ImageUploadFieldProps = {
  label: string;
  folder: "avatars" | "posts";
  currentPath: string | null;
  onUploaded: (path: string) => void;
  hint?: string;
};

export function ImageUploadField({ label, folder, currentPath, onUploaded, hint }: ImageUploadFieldProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const result = await api.uploadFile(file, folder);
      onUploaded(result.path);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="upload-field">
      <div className="upload-header">
        <div>
          <span className="upload-label">{label}</span>
          {hint ? <p className="helper-text">{hint}</p> : null}
        </div>
        <label className="ghost-button upload-button" htmlFor={inputId}>
          {uploading ? "Uploading..." : "Upload image"}
        </label>
      </div>

      <input accept="image/*" className="sr-only" id={inputId} onChange={handleFileChange} type="file" />

      {currentPath ? (
        <div className="image-preview-frame">
          <img alt={label} className="image-preview" src={currentPath} />
        </div>
      ) : null}

      {error ? <div className="error-card inline-card">{error}</div> : null}
    </div>
  );
}
