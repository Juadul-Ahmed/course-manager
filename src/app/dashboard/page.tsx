
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

type DashboardStats = {
  totalCourses: number;
  totalStudents: number;
  totalAssignments: number;
  totalMaterials: number;
};

const initialStats: DashboardStats = {
  totalCourses: 0,
  totalStudents: 0,
  totalAssignments: 0,
  totalMaterials: 0,
};

const statDetails = [
  {
    key: "totalCourses" as const,
    label: "Total Courses",
    detail: "Courses in the system",
    icon: "📚",
  },
  {
    key: "totalStudents" as const,
    label: "Total Students",
    detail: "Registered student accounts",
    icon: "👥",
  },
  {
    key: "totalAssignments" as const,
    label: "Assignments",
    detail: "Assignments created",
    icon: "📝",
  },
  {
    key: "totalMaterials" as const,
    label: "Study Materials",
    detail: "Files uploaded",
    icon: "📁",
  },
];

const actions = [
  {
    title: "Manage Courses",
    description: "Create, edit, and organize your courses.",
    href: "/dashboard/courses",
    icon: "📚",
  },
  {
    title: "Manage Students",
    description: "Create student accounts and manage enrollments.",
    href: "/dashboard/students",
    icon: "👥",
  },
  {
    title: "Assignments",
    description: "Create assignments and review submissions.",
    href: "/dashboard/assignments",
    icon: "📝",
  },
  {
    title: "Study Materials",
    description: "Upload and organize course files.",
    href: "/dashboard/materials",
    icon: "📁",
  },
  {
    title: "Timetable",
    description: "Schedule and manage classes from Monday to Friday.",
    href: "/dashboard/timetable",
    icon: "🗓️",
  },
];

function getSafeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : 0;
}

export default function AdminDashboardPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch("/api/dashboard/stats", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Failed to load dashboard statistics.";

        throw new Error(message);
      }

      if (typeof data !== "object" || data === null) {
        throw new Error("The server returned invalid dashboard statistics.");
      }

      const result = data as Record<string, unknown>;

      setStats({
        totalCourses: getSafeNumber(result.totalCourses),
        totalStudents: getSafeNumber(result.totalStudents),
        totalAssignments: getSafeNumber(result.totalAssignments),
        totalMaterials: getSafeNumber(result.totalMaterials),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard statistics."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Load statistics once when the dashboard opens.
 useEffect(() => {
  let cancelled = false;

  async function fetchStats() {
    try {
      const response = await fetch("/api/dashboard/stats", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        throw new Error("Failed to load dashboard statistics.");
      }

      if (cancelled) return;

      if (typeof data !== "object" || data === null) {
        throw new Error("Invalid dashboard statistics.");
      }

      const result = data as Record<string, unknown>;

      setStats({
        totalCourses: getSafeNumber(result.totalCourses),
        totalStudents: getSafeNumber(result.totalStudents),
        totalAssignments: getSafeNumber(result.totalAssignments),
        totalMaterials: getSafeNumber(result.totalMaterials),
      });

      setError("");
    } catch (err) {
      if (!cancelled) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard statistics."
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  void fetchStats();

  return () => {
    cancelled = true;
  };
}, []);

  function closeMenu() {
    setMenuOpen(false);
  }

  const sidebar = (
    <>
      <Link
        href="/dashboard"
        onClick={closeMenu}
        className="inline-flex w-fit items-center gap-2 text-xl font-bold tracking-tight text-[#DC2626] transition hover:text-[#B91C1C]"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-lg">
          ▤
        </span>
        Course Manager
      </Link>

      <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
        Administration
      </p>

      <nav
        aria-label="Dashboard navigation"
        className="mt-4 space-y-1.5"
      >
        <Link
          href="/dashboard"
          onClick={closeMenu}
          aria-current="page"
          className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-[#B91C1C]"
        >
          <span className="text-lg">▦</span>
          <span>Overview</span>
        </Link>

        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            onClick={closeMenu}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-[#DC2626]"
          >
            <span className="text-lg">{action.icon}</span>
            <span>{action.title}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto rounded-2xl border border-red-100 bg-red-50/70 p-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#DC2626]" />
          <p className="text-sm font-semibold text-red-800">
            Admin Workspace
          </p>
        </div>

        <p className="mt-2 text-xs leading-5 text-gray-600">
          Manage courses, students, assignments, and learning resources.
        </p>
      </div>
    </>
  );

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-gray-900">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-gray-200 bg-white p-6 md:flex">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={closeMenu}
            className="absolute inset-0 bg-gray-950/40 backdrop-blur-[2px]"
          />

          <aside
            id="mobile-dashboard-navigation"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-gray-200 bg-white p-5 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Navigation
              </span>

              <button
                type="button"
                aria-label="Close menu"
                onClick={closeMenu}
                className="rounded-xl px-3 py-2 text-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              >
                ×
              </button>
            </div>

            {sidebar}
          </aside>
        </div>
      )}

      <div className="md:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 flex min-h-[76px] items-center justify-between gap-3 border-b border-gray-200 bg-white/95 px-4 py-4 backdrop-blur-md sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-dashboard-navigation"
              onClick={() => setMenuOpen(true)}
              className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-xl transition hover:border-red-200 hover:bg-red-50 md:hidden"
            >
              ☰
            </button>

            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 sm:text-sm">
                Administration
              </p>
              <h1 className="truncate text-base font-bold sm:text-xl">
                Dashboard Overview
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden rounded-full border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-[#B91C1C] sm:inline-flex sm:text-sm">
              Administrator
            </span>

            <LogoutButton />
          </div>
        </header>

        <section className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {/* Welcome */}
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-3 py-1.5 text-xs font-semibold text-[#DC2626]">
              <span className="h-2 w-2 rounded-full bg-[#DC2626]" />
              YOUR WORKSPACE
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Welcome back, Admin
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
              Manage your learning management system, track activity, and
              organize your academic resources from one place.
            </p>
          </div>

          {/* Statistics header */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                System Statistics
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                An overview of your platform.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadStats(true)}
              disabled={loading}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span aria-hidden="true">{loading ? "⏳" : "↻"}</span>
              {loading ? "Loading..." : "Refresh Stats"}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-red-700">
                  Unable to load statistics
                </p>
                <p className="mt-1 break-words text-sm text-gray-600">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadStats(true)}
                disabled={loading}
                className="self-start rounded-lg px-3 py-2 text-sm font-semibold text-[#B91C1C] transition hover:bg-red-50 disabled:opacity-50 sm:self-center"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Statistics cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statDetails.map((stat) => (
              <article
                key={stat.key}
                className="group rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg hover:shadow-gray-200/50 sm:p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-500">
                    {stat.label}
                  </p>

                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xl transition group-hover:bg-red-100">
                    {stat.icon}
                  </span>
                </div>

                <p
                  className="mt-5 text-3xl font-bold tracking-tight text-gray-900"
                  aria-live="polite"
                >
                  {loading && !error ? "..." : stats[stat.key]}
                </p>

                <p className="mt-2 text-sm text-gray-500">{stat.detail}</p>

                <div className="mt-5 h-1 w-10 rounded-full bg-[#DC2626] transition-all duration-300 group-hover:w-16" />
              </article>
            ))}
          </div>

          {/* Quick Actions */}
          <section className="mt-10">
            <div className="mb-5">
              <h3 className="text-xl font-bold text-gray-900">
                Quick Actions
              </h3>
              <p className="mt-1.5 text-sm text-gray-500">
                Choose a section to manage.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg hover:shadow-gray-200/50 sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-2xl transition group-hover:bg-[#DC2626] group-hover:text-white">
                      {action.icon}
                    </span>

                    <span
                      aria-hidden="true"
                      className="text-xl text-gray-400 transition group-hover:translate-x-1 group-hover:text-[#DC2626]"
                    >
                      →
                    </span>
                  </div>

                  <h4 className="mt-5 font-bold text-gray-900 transition group-hover:text-[#B91C1C]">
                    {action.title}
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    {action.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <footer className="mt-10 border-t border-gray-200 py-6 text-center text-xs text-gray-400">
            Course Manager · Administration
          </footer>
        </section>
      </div>
    </main>
  );
}
