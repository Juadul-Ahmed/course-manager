import Link from "next/link";
import { FiArrowLeft, FiBookOpen, FiHome, FiSearch } from "react-icons/fi";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#faf8f6] px-5 py-12 text-[#292321]">
      {/* Decorative background */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#8b292f]/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#8b292f]/5 blur-3xl" />

      <div className="relative w-full max-w-2xl text-center">
        {/* Brand */}
        <Link
          href="/"
          className="mb-12 inline-flex items-center gap-3 rounded-xl transition-opacity hover:opacity-75"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8b292f] text-white shadow-lg shadow-[#8b292f]/15">
            <FiBookOpen size={22} />
          </div>

          <span className="text-xl font-bold tracking-tight">
            Course<span className="text-[#8b292f]">Manager</span>
          </span>
        </Link>

        {/* 404 illustration */}
        <div className="relative mx-auto mb-8 flex h-52 w-full max-w-md items-center justify-center">
          <div className="absolute h-44 w-44 rounded-full border border-[#e8d9d3]" />
          <div className="absolute h-36 w-36 rounded-full border border-dashed border-[#d9c4bd]" />

          <div className="relative flex items-center gap-2">
            <span className="text-7xl font-black tracking-tighter text-[#e6d8d2] sm:text-8xl">
              4
            </span>

            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-[#8b292f] text-white shadow-xl shadow-[#8b292f]/20 sm:h-28 sm:w-28">
              <FiSearch size={48} strokeWidth={1.5} />
            </div>

            <span className="text-7xl font-black tracking-tighter text-[#e6d8d2] sm:text-8xl">
              4
            </span>
          </div>

          <span className="absolute right-[17%] top-5 h-3 w-3 rounded-full bg-[#8b292f]/30" />
          <span className="absolute bottom-5 left-[17%] h-2 w-2 rounded-full bg-[#b58b69]" />
        </div>

        {/* Message */}
        <div className="mx-auto max-w-lg">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-[#8b292f]">
            Error 404
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Looks like you&apos;re lost.
          </h1>

          <p className="mx-auto mt-5 max-w-md text-base leading-7 text-[#827975]">
            The page you&apos;re looking for doesn&apos;t exist, may have been
            moved, or the link might be incorrect. Let&apos;s get you back on
            track.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8b292f] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#8b292f]/15 transition hover:-translate-y-0.5 hover:bg-[#702127]"
          >
            <FiHome className="text-white" size={17} />
            <span className="text-white">Back to Home</span>
          </Link>

          <Link
            href="/student"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e5d9d3] bg-white px-6 py-3.5 text-sm font-semibold text-[#51423d] transition hover:-translate-y-0.5 hover:border-[#8b292f] hover:text-[#8b292f]"
          >
            <FiArrowLeft size={17} />
            Student Dashboard
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs text-[#a19893]">
          Need a fresh start? Return to Course Manager and continue learning.
        </p>
      </div>
    </main>
  );
}
