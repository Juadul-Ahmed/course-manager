import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  BiBookOpen,
  BiChevronRight,
  BiClipboard,
  BiFile,
} from "react-icons/bi";

export default async function StudentCoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: { title: "asc" },
    include: {
      _count: {
        select: {
          assignments: true,
          files: true,
          timetableEntries: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#B52D32]">
          Your learning
        </p>
        <h1 className="mt-2 text-3xl font-bold text-zinc-900 sm:text-4xl">
          All Courses
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
          Explore your courses, assignments, study materials, and class
          schedules.
        </p>
      </header>

      <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:w-fit">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F7E9E7] text-[#B52D32]">
          <BiBookOpen size={23} />
        </div>
        <div>
          <p className="text-2xl font-bold text-zinc-900">{courses.length}</p>
          <p className="text-xs text-zinc-500">Available courses</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
          <BiBookOpen className="mx-auto text-zinc-400" size={40} />
          <h2 className="mt-4 text-lg font-semibold text-zinc-900">
            No courses available yet
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Courses will appear here when your administrator adds them.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <article
              key={course.id}
              className="group flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-[#E5C2BE] hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7E9E7] text-[#B52D32] transition group-hover:bg-[#B52D32] group-hover:text-white">
                  <BiBookOpen size={25} />
                </div>
                <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">
                  {course.code}
                </span>
              </div>

              <h2 className="mt-5 text-lg font-bold text-zinc-900">
                {course.title}
              </h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-600">
                {course.description || "No description is available yet."}
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-[#FAF9F6] p-3">
                  <BiClipboard size={18} className="text-zinc-500" />
                  <p className="mt-2 text-lg font-bold text-zinc-900">
                    {course._count.assignments}
                  </p>
                  <p className="text-[11px] text-zinc-500">Assignments</p>
                </div>

                <div className="rounded-xl bg-[#FAF9F6] p-3">
                  <BiFile size={18} className="text-zinc-500" />
                  <p className="mt-2 text-lg font-bold text-zinc-900">
                    {course._count.files}
                  </p>
                  <p className="text-[11px] text-zinc-500">Files</p>
                </div>

                <div className="rounded-xl bg-[#FAF9F6] p-3">
                  <BiBookOpen size={18} className="text-zinc-500" />
                  <p className="mt-2 text-lg font-bold text-zinc-900">
                    {course._count.timetableEntries}
                  </p>
                  <p className="text-[11px] text-zinc-500">Classes</p>
                </div>
              </div>

              <Link
                href={`/student/courses/${course.id}`}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:border-[#B52D32] hover:bg-[#FAF9F6]"
              >
                View course details
                <BiChevronRight size={19} />
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
