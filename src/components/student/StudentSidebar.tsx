"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  BiBookOpen,
  BiCalendar,
  BiHomeAlt,
  BiLogOut,
  BiMenu,
  BiTimer,
  BiX,
  BiClipboard,
} from "react-icons/bi";

const navigationItems = [
  
  {
    label: "Overview",
    href: "/student",
    icon: BiHomeAlt,
  },
  {
    label: "Courses",
    href: "/student/courses",
    icon: BiBookOpen,
  },
  {
    label: "Assignments",
    href: "/student/assignments",
    icon: BiClipboard,
  },
  {
    label: "Study Materials",
    href: "/student/materials",
    icon: BiBookOpen,
  },
  {
    label: "Time Table",
    href: "/student/timetable",
    icon: BiCalendar,
  },
  {
    label: "Focus Time",
    href: "/student/focus-time",
    icon: BiTimer,
  },
];

type StudentSidebarProps = {
  studentName: string;
  studentEmail: string;
};

export default function StudentSidebar({
  studentName,
  studentEmail,
}: StudentSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) return;

    const confirmed = window.confirm("Are you sure you want to log out?");

    if (!confirmed) return;

    setIsSigningOut(true);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        window.alert("Unable to log out. Please try again.");
        setIsSigningOut(false);
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      window.alert("Something went wrong. Please try again.");
      setIsSigningOut(false);
    }
  }

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex h-[76px] shrink-0 items-center gap-3 border-b border-zinc-200/80 px-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#B52D32] text-white shadow-sm">
          <BiBookOpen size={25} />
        </div>

        <div className="min-w-0">
          <p className="truncate text-base font-bold tracking-tight text-zinc-900">
            Course Manager
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">Student Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4 pt-7">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          Learning
        </p>

        <nav className="space-y-1.5 " aria-label="Student navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.href === "/student"
                ? pathname === "/student"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-[#B52D32] text-white shadow-md shadow-[#B52D32]/20"
                    : "text-zinc-700 hover:bg-[#F7E9E7] hover:text-[#922329] hover:translate-x-0.5"
                }`}
              >
                <Icon
                  size={21}
                  className={`shrink-0 transition-transform duration-200 ${
                    isActive
                      ? "text-white"
                      : "text-zinc-500 group-hover:text-[#922329] group-hover:scale-110"
                  }`}
                />

                <span
                  className={`flex-1 ${
                    isActive ? "!text-white" : "text-zinc-700"
                  }`}
                >
                  {item.label}
                </span>

                {isActive && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-white ring-2 ring-white/20" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="mt-auto p-4">
        <div className="mb-4 rounded-2xl border border-[#E9D6D2] bg-[#FAF3F0] p-4">
          <p className="text-xs font-semibold text-[#922329]">
            Keep making progress
          </p>

          <p className="mt-1 text-xs leading-5 text-zinc-600">
            Stay organized, complete assignments, and make time to focus.
          </p>
        </div>

        {/* Student profile */}
        <div className="flex items-center gap-3 border-t border-zinc-200/80 pt-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1DFDA] text-sm font-bold text-[#922329]">
            {studentName.trim().charAt(0).toUpperCase() || "S"}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-900">
              {studentName}
            </p>

            <p className="truncate text-xs text-zinc-500">{studentEmail}</p>
          </div>
        </div>

        {/* Visible logout button */}
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-[#B52D32] transition hover:border-[#B52D32] hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <BiLogOut size={20} />

          <span>{isSigningOut ? "Logging out..." : "Logout"}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[270px] flex-col border-r border-zinc-200/80 bg-white lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile header */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-zinc-200/80 bg-white/95 px-4 backdrop-blur-lg lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#B52D32] text-white">
            <BiBookOpen size={21} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-zinc-900">
              Course Manager
            </p>

            <p className="text-[11px] text-zinc-500">Student Portal</p>
          </div>
        </div>

        <div className="ml-2 flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-[#B52D32] transition hover:bg-red-50 disabled:opacity-60"
          >
            <BiLogOut size={17} />

            <span>{isSigningOut ? "Logging out..." : "Logout"}</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-700 transition hover:bg-zinc-50"
          >
            {mobileOpen ? <BiX size={25} /> : <BiMenu size={25} />}
          </button>
        </div>
      </header>

      {/* Mobile backdrop and drawer */}
      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-zinc-950/30 lg:hidden"
          />

          <aside className="fixed inset-y-0 left-0 z-50 flex w-[290px] max-w-[85vw] flex-col overflow-y-auto border-r border-zinc-200 bg-white shadow-xl lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
