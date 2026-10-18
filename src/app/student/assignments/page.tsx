
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiRefreshCw,
  FiSend,
} from "react-icons/fi";

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  course: {
    id: string;
    title: string;
    code: string;
  };
  attachments: {
    id: string;
    originalName: string;
    mimeType: string | null;
    size: number;
  }[];
  submission: {
    id: string;
    status: "SUBMITTED" | "GRADED";
    grade: number | null;
    feedback: string | null;
    submittedAt: string;
  } | null;
};

type Filter = "ALL" | "PENDING" | "SUBMITTED";

function getDeadline(dueDate: string | null, currentTime: number) {
  if (!dueDate) return "No deadline";

  const due = new Date(dueDate).getTime();

  if (due < currentTime) return "Overdue";

  const days = Math.floor(
    (due - currentTime) / (1000 * 60 * 60 * 24),
  );

  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";

  return `${days} days left`;
}

function formatDate(date: string | null) {
  if (!date) return "No deadline set";

  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFileSize(size: number) {
  if (size <= 0) return "File attachment";
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [fileAction, setFileAction] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [currentTime] = useState(() => Date.now());

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/student/assignments", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load assignments.");
      }

      if (!Array.isArray(data)) {
        throw new Error("The server returned an unexpected response.");
      }

      setAssignments(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading assignments.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchAssignments();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchAssignments]);

  const submitAssignment = async (assignment: Assignment) => {
    if (assignment.submission || submittingId) return;

    const confirmed = window.confirm(
      `Mark "${assignment.title}" as submitted?`,
    );

    if (!confirmed) return;

    setSubmittingId(assignment.id);
    setNotice("");
    setError("");

    try {
      const response = await fetch(
        `/api/student/assignments/${encodeURIComponent(assignment.id)}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not submit this assignment.");
      }

      setNotice(`"${assignment.title}" submitted successfully!`);
      await fetchAssignments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while submitting.",
      );
    } finally {
      setSubmittingId(null);
    }
  };

 
const openAttachment = async (
  assignmentId: string,
  fileId: string,
  mode: "view" | "download",
) => {
  const actionKey = `${fileId}-${mode}`;

  // Open a tab immediately for viewing to avoid popup blocking.
  const previewTab =
    mode === "view" ? window.open("about:blank", "_blank") : null;

  setFileAction(actionKey);
  setError("");

  try {
    const url =
      `/api/assignments/${encodeURIComponent(assignmentId)}` +
      `/files/${encodeURIComponent(fileId)}` +
      `?mode=${mode}`;

    const response = await fetch(url, {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      throw new Error(data.error || "Could not access this attachment.");
    }

    if (mode === "view") {
      if (previewTab) {
        previewTab.opener = null;
        previewTab.location.href = data.url;
      } else {
        // Open a new tab rather than modifying window.location.
        const newTab = document.createElement("a");
        newTab.href = data.url;
        newTab.target = "_blank";
        newTab.rel = "noopener noreferrer";
        newTab.click();
      }
    } else {
      const link = document.createElement("a");
      link.href = data.url;
      link.download = data.name || "attachment";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  } catch (err) {
    if (previewTab && !previewTab.closed) {
      previewTab.close();
    }

    setError(
      err instanceof Error
        ? err.message
        : "Unable to open this attachment.",
    );
  } finally {
    setFileAction(null);
  }
};


  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return assignments.filter((assignment) => {
      const submitted = Boolean(assignment.submission);

      const matchesFilter =
        filter === "ALL" ||
        (filter === "SUBMITTED" && submitted) ||
        (filter === "PENDING" && !submitted);

      const matchesSearch =
        !query ||
        assignment.title.toLowerCase().includes(query) ||
        assignment.course.title.toLowerCase().includes(query) ||
        assignment.course.code.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [assignments, filter, search]);

  const submittedCount = assignments.filter(
    (assignment) => Boolean(assignment.submission),
  ).length;

  const pendingCount = assignments.length - submittedCount;

  const overdueCount = assignments.filter((assignment) => {
    return (
      !assignment.submission &&
      assignment.dueDate !== null &&
      new Date(assignment.dueDate).getTime() < currentTime
    );
  }).length;

  return (
    <main className="min-h-screen bg-[#FAF9F6] px-4 py-8 text-[#292524] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#B52D32]">
              Student workspace
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Assignments
            </h1>

            <p className="mt-2 text-sm text-stone-500 sm:text-base">
              Keep track of your coursework and deadlines.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchAssignments()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold transition hover:border-[#B52D32]/30 hover:text-[#B52D32] disabled:opacity-50 sm:self-auto"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>

        {notice && (
          <div
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            <div className="flex items-center gap-2">
              <FiCheckCircle className="shrink-0" />
              {notice}
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void fetchAssignments()}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total assignments"
            value={assignments.length}
            icon={<FiFileText />}
          />

          <StatCard
            label="Awaiting submission"
            value={pendingCount}
            icon={<FiClock />}
          />

          <StatCard
            label="Submitted"
            value={submittedCount}
            icon={<FiCheckCircle />}
          />
        </section>

        {overdueCount > 0 && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            You have {overdueCount} overdue assignment
            {overdueCount === 1 ? "" : "s"} that have not been submitted.
          </div>
        )}

        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold">Your coursework</h2>
              <p className="mt-1 text-sm text-stone-500">
                Browse assignments, attachments, and deadlines.
              </p>
            </div>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assignments..."
              aria-label="Search assignments"
              className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-[#B52D32] lg:max-w-xs"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {(
              [
                ["ALL", "All assignments"],
                ["PENDING", "Pending"],
                ["SUBMITTED", "Submitted"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  filter === value
                    ? "bg-[#B52D32] text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="py-12 text-center text-sm text-stone-500">
                Loading assignments...
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 px-5 py-12 text-center">
                <FiFileText className="mx-auto text-3xl text-stone-400" />
                <p className="mt-3 font-semibold">No assignments found</p>
                <p className="mt-1 text-sm text-stone-500">
                  Try another filter or check back later.
                </p>
              </div>
            ) : (
              filteredAssignments.map((assignment) => {
                const submitted = Boolean(assignment.submission);

                const overdue =
                  !submitted &&
                  assignment.dueDate !== null &&
                  new Date(assignment.dueDate).getTime() < currentTime;

                const isSubmitting = submittingId === assignment.id;

                return (
                  <article
                    key={assignment.id}
                    className="rounded-2xl border border-stone-200 p-4 transition hover:border-[#B52D32]/30 hover:shadow-sm sm:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F8ECEA] text-lg text-[#B52D32]">
                          <FiFileText />
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-bold">{assignment.title}</h3>

                          <p className="mt-1 text-sm text-stone-500">
                            {assignment.course.code} · {assignment.course.title}
                          </p>

                          {assignment.description && (
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-600">
                              {assignment.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                          submitted
                            ? assignment.submission?.status === "GRADED"
                              ? "bg-green-100 text-green-800"
                              : "bg-green-50 text-green-700"
                            : overdue
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {submitted ? <FiCheckCircle /> : <FiClock />}

                        {submitted
                          ? assignment.submission?.status === "GRADED"
                            ? "Graded"
                            : "Submitted"
                          : overdue
                            ? "Overdue"
                            : "Pending"}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-col gap-4 border-t border-stone-100 pt-4">
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-stone-500">
                        <span className="inline-flex items-center gap-2">
                          <FiCalendar className="text-[#B52D32]" />
                          Due: {formatDate(assignment.dueDate)}
                        </span>

                        <span className={overdue ? "font-semibold text-red-600" : ""}>
                          {submitted
                            ? `Submitted ${formatDate(assignment.submission!.submittedAt)}`
                            : getDeadline(assignment.dueDate, currentTime)}
                        </span>
                      </div>

                      {assignment.attachments.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-stone-700">
                            Attachments ({assignment.attachments.length})
                          </p>

                          {assignment.attachments.map((attachment) => {
                            const actionKey = `${attachment.id}-`;

                            return (
                              <div
                                key={attachment.id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-[#FAF9F6] p-3"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F8ECEA] text-[#B52D32]">
                                    <FiFileText size={18} />
                                  </div>

                                  <div className="min-w-0">
                                    <p
                                      className="truncate text-sm font-medium text-stone-800"
                                      title={attachment.originalName}
                                    >
                                      {attachment.originalName}
                                    </p>

                                    <p className="mt-1 text-xs text-stone-500">
                                      {formatFileSize(attachment.size)}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void openAttachment(
                                        assignment.id,
                                        attachment.id,
                                        "view",
                                      )
                                    }
                                    disabled={fileAction === `${actionKey}view`}
                                    aria-label={`View ${attachment.originalName}`}
                                    title="View attachment"
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 transition hover:bg-white hover:text-[#B52D32] disabled:opacity-50"
                                  >
                                    <FiExternalLink size={17} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void openAttachment(
                                        assignment.id,
                                        attachment.id,
                                        "download",
                                      )
                                    }
                                    disabled={fileAction === `${actionKey}download`}
                                    aria-label={`Download ${attachment.originalName}`}
                                    title="Download attachment"
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 transition hover:bg-white hover:text-[#B52D32] disabled:opacity-50"
                                  >
                                    <FiDownload size={17} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex flex-col gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-stone-500">
                          {submitted
                            ? "Your submission has been recorded."
                            : "When you are ready, mark this assignment as submitted."}
                        </p>

                        <button
                          type="button"
                          onClick={() => void submitAssignment(assignment)}
                          disabled={submitted || Boolean(submittingId)}
                          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed sm:w-auto ${
                            submitted
                              ? "border border-green-200 bg-green-50 text-green-700"
                              : "bg-[#B52D32] text-white hover:bg-[#982329] disabled:opacity-60"
                          }`}
                        >
                          {submitted ? (
                            <>
                              <FiCheckCircle />
                              Submitted
                            </>
                          ) : isSubmitting ? (
                            <>
                              <FiRefreshCw className="animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <FiSend />
                              Mark as submitted
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {assignment.submission?.status === "GRADED" && (
                      <div className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-800">
                        <p className="font-semibold">
                          Grade: {assignment.submission.grade ?? "Not provided"}
                        </p>

                        {assignment.submission.feedback && (
                          <p className="mt-2 whitespace-pre-wrap">
                            {assignment.submission.feedback}
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-stone-500">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8ECEA] text-lg text-[#B52D32]">
          {icon}
        </span>
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
