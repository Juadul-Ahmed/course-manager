
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();

  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await authClient.signIn.username({
        username: studentId.trim(),
        password,
      });

      if (result.error) {
        setError("Invalid Student ID or password.");
        return;
      }

      // Retrieve the authenticated user's session.
      const sessionResult = await authClient.getSession();

      if (sessionResult.error || !sessionResult.data?.user) {
        setError(
          "Unable to retrieve your account. Please try signing in again."
        );
        await authClient.signOut();
        return;
      }

      // Redirect according to the authenticated user's role.
      const role = sessionResult.data.user.role;

      if (role === "ADMIN") {
        router.replace("/dashboard");
      } else if (role === "STUDENT") {
        router.replace("/student");
      } else {
        setError(
          "Your account does not have a valid role. Contact your administrator."
        );
        await authClient.signOut();
        return;
      }

      router.refresh();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FEF2F2] px-4 py-12 text-zinc-900">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#DC2626]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-[#DC2626]/[0.07] blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#DC2626] text-2xl font-bold text-white shadow-lg shadow-[#DC2626]/20">
            C
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#DC2626]">
            Academic Portal
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Course Manager
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Your learning, organized in one place.
          </p>
        </div>

        <section className="rounded-3xl border border-zinc-200/80 bg-white p-7 shadow-xl shadow-zinc-900/[0.04] sm:p-9">
          <div className="mb-7">
            <h2 className="text-xl font-semibold tracking-tight">
              Welcome back
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Sign in using the Student ID and password provided by your
              administrator.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="studentId"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Student ID
              </label>

              <input
                id="studentId"
                name="studentId"
                type="text"
                autoComplete="username"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                placeholder="Enter your Student ID"
                required
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 px-4 py-3.5 text-sm text-zinc-900 outline-none transition duration-200 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-[#DC2626] focus:bg-white focus:ring-4 focus:ring-[#DC2626]/10"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 px-4 py-3.5 text-sm text-zinc-900 outline-none transition duration-200 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-[#DC2626] focus:bg-white focus:ring-4 focus:ring-[#DC2626]/10"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || !studentId.trim() || !password}
              className="w-full rounded-xl bg-[#DC2626] px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#DC2626]/15 transition duration-200 hover:bg-[#B91C1C] hover:shadow-lg hover:shadow-[#DC2626]/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {isLoading ? "Signing in..." : "Sign in to your account"}
            </button>
          </form>

          <div className="my-6 border-t border-zinc-100" />

          <p className="text-center text-xs leading-5 text-zinc-500">
            Need access? Contact your course administrator.
          </p>
        </section>

        <p className="mt-7 text-center text-xs text-zinc-400">
          Course Manager · Academic access portal
        </p>
      </div>
    </main>
  );
}
