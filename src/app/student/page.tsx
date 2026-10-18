import Link from "next/link";
import {
  BiBookOpen,
  BiCalendar,
  BiChevronRight,
  BiClipboard,
  BiTimer,
} from "react-icons/bi";

const sections = [
  {
    title: "Courses",
    description: "Explore your courses, class resources, and assignments.",
    href: "/student/courses",
    icon: BiBookOpen,
    label: "Browse courses",
  },
  {
    title: "Assignments",
    description: "Review your assignments and upcoming deadlines.",
    href: "/student/assignments",
    icon: BiClipboard,
    label: "View assignments",
  },
  {
    title: "Study Materials",
    description: "Access course notes, documents, and learning resources.",
    href: "/student/materials",
    icon: BiBookOpen,
    label: "Browse materials",
  },
  {
    title: "Time Table",
    description: "Check your classes and weekly schedule.",
    href: "/student/timetable",
    icon: BiCalendar,
    label: "View timetable",
  },
  {
    title: "Focus Time",
    description: "Set aside time for focused study sessions.",
    href: "/student/focus-time",
    icon: BiTimer,
    label: "Start focusing",
  },
];

export default function StudentOverviewPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-[#B52D32] px-6 py-8 text-white sm:px-9 sm:py-10">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[35px] border-white/[0.07]" />
        <div className="pointer-events-none absolute -bottom-24 right-40 h-48 w-48 rounded-full bg-white/[0.05] blur-2xl" />

        <div className="relative max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
            STUDENT PORTAL
          </span>

          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome to your learning space.
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
            Keep your assignments organized, access your study materials, check
            your class schedule, and make time to focus.
          </p>

          <Link
            href="/student/focus-time"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold !text-black transition hover:bg-[#FAEAE7]"
          >
            <BiTimer size={20} className="!text-black" />

            <span className="!text-black">Start a focus session</span>

            <BiChevronRight size={19} className="!text-black" />
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-5">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">
            Your learning space
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Everything you need for your studies, in one place.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <Link
                key={section.href}
                href={section.href}
                className="group rounded-2xl border border-zinc-200/80 bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-[#D8A4A0] hover:shadow-lg hover:shadow-zinc-900/[0.04]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F8EAE7] text-[#B52D32] transition group-hover:bg-[#B52D32] group-hover:text-white">
                    <Icon size={25} />
                  </div>

                  <BiChevronRight
                    size={22}
                    className="text-zinc-400 transition group-hover:translate-x-1 group-hover:text-[#B52D32]"
                  />
                </div>

                <h3 className="mt-5 font-semibold text-zinc-900">
                  {section.title}
                </h3>

                <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-500">
                  {section.description}
                </p>

                <p className="mt-4 text-sm font-semibold text-[#B52D32]">
                  {section.label}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-zinc-300 bg-white/70 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F8EAE7] text-[#B52D32]">
            <BiBookOpen size={23} />
          </div>

          <div>
            <h2 className="font-semibold text-zinc-900">
              Your study resources
            </h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Access course notes, assignment attachments, and learning
              resources uploaded by your administrator.
            </p>

            <Link
              href="/student/materials"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#B52D32] hover:underline"
            >
              Go to study materials
              <BiChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
