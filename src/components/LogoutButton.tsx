
"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { FiLogOut } from "react-icons/fi";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
  try {
    setLoading(true);

    const result = await authClient.signOut();

    if (result.error) {
      throw new Error(result.error.message || "Logout failed.");
    }

    router.replace("/");
    router.refresh();
  } catch (error) {
    console.error("Logout failed:", error);
    setLoading(false);
  }
}

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <FiLogOut size={16} />
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}
