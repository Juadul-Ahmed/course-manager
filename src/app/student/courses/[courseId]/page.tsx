import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DownloadFileButton from "@/components/student/DownloadFileButton";
import {
  BiArrowBack,
  BiCalendar,
  BiFile,
  BiClipboard,
} from "react-icons/bi";

type Props = {
  params: Promise<{ courseId: string }>;
};

function formatDate(date: Date | null) {
  if (!date) return "No deadline";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatSize(size: number | null) {
  if (size == null) return "File";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function StudentCourseDetailsPage({
  params,
}: Props) {
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      files: {
        orderBy: { createdAt: "desc" },
      },
      assignments: {
        orderBy: { dueDate: "asc" },
        include: {
          attachments: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
      timetableEntries: {
        orderBy: [
          { dayOfWeek: "asc" },
          { startTime: "asc" },
        ],
      },
    },
  });

  if (!course) notFound();

  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <Link
        href="/student/courses"
        className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-[#B52D32]"
      >
        <BiArrowBack size={19} />
        Back to all courses
      </Link>

      <section className="rounded-3xl bg-[#B52D32] p-6 text-white sm:p-9">
        <span className="inline-flex rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold">
          {course.code}
        </span>

        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {course.title}
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/90">
          {course.description || "No course description is available."}
        </p>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <span className="rounded-xl bg-white/10 px-4 py-2">
            {course.files.length} course files
          </span>

          <span className="rounded-xl bg-white/10 px-4 py-2">
            {course.assignments.length} assignments
          </span>

          <span className="rounded-xl bg-white/10 px-4 py-2">
            {course.timetableEntries.length} class sessions
          </span>
        </div>
      </section>
            <section className="space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
            <BiFile className="text-[#B52D32]" size={23} />
            Study Materials
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            View and download resources uploaded for this course.
          </p>
        </div>

        {course.files.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500">
            No course files have been uploaded yet.
          </p>
        ) : (
          <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white">
            {course.files.map((file) => (
              <div
                key={file.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F7E9E7] text-[#B52D32]">
                    <BiFile size={22} />
                  </div>

                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-zinc-900">
                      {file.name}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {formatSize(file.size)}
                      {file.mimeType ? ` · ${file.mimeType}` : ""}
                    </p>
                  </div>
                </div>

                <DownloadFileButton
                  endpoint={`/api/materials/${file.id}`}
                  label="Download / Open"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
            <BiClipboard className="text-[#B52D32]" size={23} />
            Assignments
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Review assignment instructions, deadlines, and attachments.
          </p>
        </div>

        {course.assignments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500">
            No assignments have been added to this course yet.
          </p>
        ) : (
          <div className="space-y-4">
            {course.assignments.map((assignment) => (
              <article
                key={assignment.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-900">
                      {assignment.title}
                    </h3>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-600">
                      {assignment.description || "No instructions provided."}
                    </p>
                  </div>

                  <span className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#FAF3F0] px-3 py-2 text-xs font-semibold text-[#922329]">
                    <BiCalendar size={16} />
                    Due: {formatDate(assignment.dueDate)}
                  </span>
                </div>

                {assignment.attachments.length > 0 && (
                  <div className="mt-5 border-t border-zinc-100 pt-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Assignment files
                    </p>

                    <div className="space-y-2">
                      {assignment.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex flex-col gap-3 rounded-xl bg-[#FAF9F6] p-3 sm:flex-row sm:items-center"
                        >
                          <BiFile
                            className="shrink-0 text-[#B52D32]"
                            size={20}
                          />

                          <div className="min-w-0 flex-1">
                            <p className="break-words text-sm font-medium text-zinc-800">
                              {attachment.originalName}
                            </p>

                            <p className="mt-1 text-xs text-zinc-500">
                              {formatSize(attachment.size)}
                            </p>
                          </div>

                          <DownloadFileButton
                            endpoint={`/api/assignments/${assignment.id}/files/${attachment.id}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
            <section className="space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
            <BiCalendar className="text-[#B52D32]" size={23} />
            Class Schedule
          </h2>
        </div>

        {course.timetableEntries.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500">
            No timetable entries are available for this course.
          </p>
        ) : (
          <div className="space-y-3">
            {course.timetableEntries.map((entry) => (
              <article
                key={entry.id}
                className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-28 rounded-xl bg-[#F7E9E7] px-4 py-3 text-center">
                  <p className="text-sm font-bold text-[#922329]">
                    {weekdays[entry.dayOfWeek] ?? "Class"}
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    {entry.startTime} – {entry.endTime}
                  </p>
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-zinc-900">
                    {entry.title}
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">
                    {entry.instructor || "Instructor not specified"}
                    {entry.room ? ` · ${entry.room}` : ""}
                  </p>

                  {entry.notes && (
                    <p className="mt-2 text-sm text-zinc-600">
                      {entry.notes}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}