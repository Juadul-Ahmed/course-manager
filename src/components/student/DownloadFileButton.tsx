"use client";

import { useState } from "react";
import { BiDownload } from "react-icons/bi";

type Props = {
  endpoint: string;
  label?: string;
};

export default function DownloadFileButton({
  endpoint,
  label = "Download",
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch(endpoint);
      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Download failed.");
      }

      window.location.assign(data.url);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not download the file.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:border-[#B52D32] hover:bg-[#FAF9F6] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <BiDownload size={18} />
      {loading ? "Preparing..." : label}
    </button>
  );
}