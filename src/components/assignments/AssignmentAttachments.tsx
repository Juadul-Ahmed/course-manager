
"use client";

import { useCallback, useEffect, useState } from "react";

type Attachment = {
  id: string;
  originalName: string;
  mimeType: string | null;
  size: number;
  createdAt: string;
};

type Props = {
  assignmentId: string;
  isAdmin: boolean;
};

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AssignmentAttachments({
  assignmentId,
  isAdmin,
}: Props) {
  const [files, setFiles] = useState<Attachment[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadFiles = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/assignments/${assignmentId}/files`,
        { cache: "no-store" },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load files.");
      }

      setFiles(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load files.",
      );
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFiles();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadFiles]);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setError("Choose a file first.");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        `/api/assignments/${assignmentId}/files`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      setSelectedFile(null);
      setMessage("File uploaded successfully.");

      const input = document.getElementById(
        `assignment-file-${assignmentId}`,
      ) as HTMLInputElement | null;

      if (input) input.value = "";

      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(file: Attachment) {
    setError("");

    try {
      const response = await fetch(
        `/api/assignments/${assignmentId}/files/${file.id}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Download failed.");
      }

      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    }
  }

  async function handleDelete(file: Attachment) {
    if (!window.confirm(`Delete "${file.originalName}"?`)) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/assignments/${assignmentId}/files/${file.id}`,
        { method: "DELETE" },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Delete failed.");
      }

      setFiles((current) => current.filter((item) => item.id !== file.id));
      setMessage("File deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  return (
    <section className="mt-5 rounded-xl border border-red-100 bg-white p-4">
      <h4 className="font-semibold text-gray-900">Assignment files</h4>
      <p className="mt-1 text-sm text-gray-500">
        Download the attached instructions and resources.
      </p>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {message}
        </p>
      )}

      {isAdmin && (
        <form onSubmit={handleUpload} className="mt-4 space-y-3">
          <label
            htmlFor={`assignment-file-${assignmentId}`}
            className="block text-sm font-medium text-gray-700"
          >
            Attach a file (maximum 100 MB)
          </label>

          <input
            id={`assignment-file-${assignmentId}`}
            type="file"
            onChange={(event) =>
              setSelectedFile(event.target.files?.[0] ?? null)
            }
            className="block w-full rounded-lg border border-gray-200 p-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-red-50 file:px-3 file:py-2 file:font-medium file:text-red-700"
          />

          {selectedFile && (
            <p className="break-all text-xs text-gray-500">
              {selectedFile.name} · {formatSize(selectedFile.size)}
            </p>
          )}

          <button
            type="submit"
            disabled={!selectedFile || uploading}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload file"}
          </button>
        </form>
      )}

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-sm text-gray-500">Loading files...</p>
        ) : files.length === 0 ? (
          <p className="text-sm text-gray-500">No files attached yet.</p>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="flex flex-col gap-3 rounded-lg border border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="break-all text-sm font-medium text-gray-800">
                  📎 {file.originalName}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {formatSize(file.size)} ·{" "}
                  {new Date(file.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => void handleDownload(file)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Download
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => void handleDelete(file)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
