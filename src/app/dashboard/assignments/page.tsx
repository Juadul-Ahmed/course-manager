
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AssignmentCountdown from "@/components/assignments/AssignmentCountdown";
import AssignmentAttachments from "@/components/assignments/AssignmentAttachments";

type Course = {
  id: string;
  title: string;
  code: string;
};

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  courseId: string;
  course: Course;
  _count?: {
    submissions: number;
  };
};

type AssignmentForm = {
  title: string;
  description: string;
  courseId: string;
  dueDate: string;
};

const emptyForm: AssignmentForm = {
  title: "",
  description: "",
  courseId: "",
  dueDate: "",
};

const MAX_FILE_SIZE = 100 * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDeadlineStatus(
  dueDate: string | null,
  now: number | null,
) {
  if (!dueDate) {
    return {
      label: "No deadline",
      className: "bg-gray-100 text-gray-600",
    };
  }

  if (now === null) {
    return {
      label: "Checking deadline",
      className: "bg-gray-100 text-gray-600",
    };
  }

  if (new Date(dueDate).getTime() <= now) {
    return {
      label: "Past deadline",
      className: "bg-red-50 text-red-700 ring-red-100",
    };
  }

  const remaining = new Date(dueDate).getTime() - now;
  const oneDay = 24 * 60 * 60 * 1000;

  if (remaining <= oneDay) {
    return {
      label: "Due soon",
      className: "bg-amber-50 text-amber-700 ring-amber-100",
    };
  }

  return {
    label: "Upcoming",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  };
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<AssignmentForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [now, setNow] = useState<number | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [courseResponse, assignmentResponse] = await Promise.all([
        fetch("/api/courses", { cache: "no-store" }),
        fetch("/api/assignments", { cache: "no-store" }),
      ]);

      const [courseData, assignmentData] = await Promise.all([
        courseResponse.json(),
        assignmentResponse.json(),
      ]);

      if (!courseResponse.ok) {
        throw new Error(courseData.error || "Failed to load courses.");
      }

      if (!assignmentResponse.ok) {
        throw new Error(
          assignmentData.error || "Failed to load assignments.",
        );
      }

      const courseList: Course[] = Array.isArray(courseData)
        ? courseData
        : courseData.courses ?? [];

      const assignmentList: Assignment[] = Array.isArray(assignmentData)
        ? assignmentData
        : assignmentData.assignments ?? [];

      setCourses(courseList);
      setAssignments(assignmentList);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load assignment data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

 useEffect(() => {
  const timer = window.setInterval(() => {
    setNow(Date.now());
  }, 1000);

  return () => window.clearInterval(timer);
}, []);

  function openCreateForm() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      courseId: courses[0]?.id ?? "",
    });
    setPendingFiles([]);
    setUploadProgress("");
    setError("");
    setShowForm(true);
  }

  function openEditForm(assignment: Assignment) {
    setEditingId(assignment.id);
    setForm({
      title: assignment.title,
      description: assignment.description ?? "",
      courseId: assignment.courseId,
      dueDate: assignment.dueDate
        ? new Date(assignment.dueDate).toISOString().slice(0, 16)
        : "",
    });
    setPendingFiles([]);
    setUploadProgress("");
    setError("");
    setShowForm(true);
  }

  function handleFileSelection(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFiles = Array.from(event.target.files ?? []);
    const validFiles: File[] = [];
    const rejectedFiles: string[] = [];

    for (const file of selectedFiles) {
      if (file.size === 0) {
        rejectedFiles.push(`${file.name}: empty files are not allowed`);
      } else if (file.size > MAX_FILE_SIZE) {
        rejectedFiles.push(`${file.name}: exceeds the 100 MB limit`);
      } else {
        validFiles.push(file);
      }
    }

    setPendingFiles((current) => [...current, ...validFiles]);

    if (rejectedFiles.length > 0) {
      setError(rejectedFiles.join(". "));
    } else {
      setError("");
    }

    event.target.value = "";
  }

  function removePendingFile(index: number) {
    setPendingFiles((current) =>
      current.filter((_, fileIndex) => fileIndex !== index),
    );
  }

  async function uploadPendingFiles(assignmentId: string) {
    const failedUploads: string[] = [];
    const successfulFiles: File[] = [];

    for (let index = 0; index < pendingFiles.length; index++) {
      const file = pendingFiles[index];

      setUploadProgress(
        `Uploading file ${index + 1} of ${pendingFiles.length}: ${file.name}`,
      );

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
          `/api/assignments/${assignmentId}/files`,
          {
            method: "POST",
            body: formData,
          },
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Upload failed.");
        }

        successfulFiles.push(file);
      } catch (err) {
        failedUploads.push(
          `${file.name}: ${
            err instanceof Error ? err.message : "Upload failed"
          }`,
        );
      }
    }

    return { failedUploads, successfulFiles };
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.courseId) {
      setError("Please select a course.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    setUploadProgress("");

    let savedAssignmentId: string | null = editingId;

    try {
      const response = await fetch(
        editingId
          ? `/api/assignments/${editingId}`
          : "/api/assignments",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim(),
            courseId: form.courseId,
            dueDate: form.dueDate
              ? new Date(form.dueDate).toISOString()
              : null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save assignment.");
      }

      if (!savedAssignmentId) {
        savedAssignmentId = data.id ?? data.assignment?.id ?? null;
      }

      if (!savedAssignmentId) {
        throw new Error(
          "The assignment was saved, but its ID was not returned. Check your assignments API response.",
        );
      }

      if (pendingFiles.length > 0) {
        const { failedUploads, successfulFiles } =
          await uploadPendingFiles(savedAssignmentId);

        if (failedUploads.length > 0) {
          setPendingFiles((current) =>
            current.filter((file) => !successfulFiles.includes(file)),
          );

          setError(
            `The assignment was saved, but some files failed to upload:\n${failedUploads.join("\n")}`,
          );

          await loadData();
          return;
        }
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      setPendingFiles([]);
      setUploadProgress("");
      setSuccess(
        editingId
          ? "Assignment updated successfully."
          : "Assignment created successfully.",
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save assignment.",
      );
    } finally {
      setSaving(false);
      setUploadProgress("");
    }
  }

  async function handleDelete(assignment: Assignment) {
    const confirmed = window.confirm(
      `Delete "${assignment.title}"? This also deletes its submission records and attachments.`,
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(assignment.id);

    try {
      const response = await fetch(
        `/api/assignments/${assignment.id}`,
        { method: "DELETE" },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete assignment.");
      }

      setAssignments((current) =>
        current.filter((item) => item.id !== assignment.id),
      );
      setSuccess("Assignment deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete assignment.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return assignments.filter((assignment) => {
      return (
        assignment.title.toLowerCase().includes(query) ||
        (assignment.course?.title ?? "").toLowerCase().includes(query) ||
        (assignment.course?.code ?? "").toLowerCase().includes(query)
      );
    });
  }, [assignments, search]);

  const upcomingCount = assignments.filter(
    (assignment) =>
      now !== null &&
      assignment.dueDate !== null &&
      new Date(assignment.dueDate).getTime() > now,
  ).length;

  const overdueCount = assignments.filter(
    (assignment) =>
      now !== null &&
      assignment.dueDate !== null &&
      new Date(assignment.dueDate).getTime() <= now,
  ).length;

  const noDeadlineCount = assignments.filter(
    (assignment) => !assignment.dueDate,
  ).length;

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-6 text-gray-900 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Page heading */}
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-red-700">
              <span className="h-2 w-2 rounded-full bg-red-600" />
              Course Manager
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Assignments
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
              Manage coursework, attachments, deadlines, and submission
              progress from one place.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-4 focus:ring-red-100"
            >
              <span aria-hidden="true">←</span>
              Back to Dashboard
            </Link>

            <button
              type="button"
              onClick={openCreateForm}
              disabled={courses.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#B91C1C] focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span aria-hidden="true">+</span>
              Create assignment
            </button>
          </div>
        </header>

        {/* Feedback */}
        {error && (
          <div
            role="alert"
            className="flex items-start justify-between gap-4 whitespace-pre-wrap rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-800"
          >
            <span className="min-w-0">{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 rounded-lg px-2 py-1 font-semibold hover:bg-red-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-6 text-emerald-800"
          >
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Dismiss success message"
              className="shrink-0 rounded-lg px-2 py-1 font-semibold hover:bg-emerald-100"
            >
              ×
            </button>
          </div>
        )}

        {/* Statistics */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total assignments"
            value={loading ? "—" : assignments.length}
            detail="Across all courses"
            icon="▤"
            iconStyle="bg-red-50 text-red-700"
          />
          <StatCard
            label="Upcoming deadlines"
            value={loading ? "—" : upcomingCount}
            detail="Still to be completed"
            icon="◷"
            iconStyle="bg-emerald-50 text-emerald-700"
          />
          <StatCard
            label="Past deadlines"
            value={loading ? "—" : overdueCount}
            detail="Deadline has passed"
            icon="!"
            iconStyle="bg-orange-50 text-orange-700"
          />
          <StatCard
            label="No deadline"
            value={loading ? "—" : noDeadlineCount}
            detail="Without a due date"
            icon="∞"
            iconStyle="bg-gray-100 text-gray-700"
          />
        </section>

        {/* Assignments library */}
        <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5 sm:p-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-950 sm:text-xl">
                    All assignments
                  </h2>
                  {!loading && (
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                      {filteredAssignments.length}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Search coursework, track deadlines, and manage attachments.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 sm:w-72">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    ⌕
                  </span>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search assignments..."
                    aria-label="Search assignments"
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void loadData()}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span aria-hidden="true">↻</span>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center px-6 py-16">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-red-100 border-t-red-600" />
              <p className="mt-4 text-sm text-gray-500">
                Loading assignments...
              </p>
            </div>
          ) : courses.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl text-red-700">
                ▦
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">
                No courses available
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Create a course before adding an assignment.
              </p>
              <Link
                href="/dashboard/courses"
                className="mt-5 inline-flex items-center justify-center rounded-xl bg-[#DC2626] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#B91C1C]"
              >
                Manage courses
              </Link>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl text-red-700">
                ▤
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">
                {search ? "No matching assignments" : "No assignments yet"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                {search
                  ? "Try a different search term."
                  : "Create your first assignment to get started."}
              </p>
              {!search && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 rounded-xl bg-[#DC2626] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#B91C1C]"
                >
                  Create your first assignment
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">
              {filteredAssignments.map((assignment) => {
                const deadline = getDeadlineStatus(
                  assignment.dueDate,
                  now,
                );

                return (
                  <article
                    key={assignment.id}
                    className="group min-w-0 rounded-2xl border border-gray-200/80 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:shadow-lg hover:shadow-gray-900/5 sm:p-6"
                  >
                    {/* Assignment header */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-lg font-bold text-red-700 transition group-hover:bg-red-100">
                        ▤
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex max-w-full items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">
                            {assignment.course?.code ?? "Course"}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${deadline.className}`}
                          >
                            {deadline.label}
                          </span>
                        </div>

                        <h3 className="mt-3 break-words text-base font-bold leading-6 text-gray-950 sm:text-lg">
                          {assignment.title}
                        </h3>
                        <p className="mt-1 break-words text-sm text-gray-500">
                          {assignment.course?.title ?? "Course unavailable"}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => openEditForm(assignment)}
                          aria-label={`Edit ${assignment.title}`}
                          title="Edit assignment"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-sm text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(assignment)}
                          disabled={deletingId === assignment.id}
                          aria-label={`Delete ${assignment.title}`}
                          title="Delete assignment"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-base text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === assignment.id ? "…" : "×"}
                        </button>
                      </div>
                    </div>

                    {assignment.description && (
                      <p className="mt-4 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
                        {assignment.description}
                      </p>
                    )}

                    {/* Deadline */}
                    <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          {assignment.dueDate
                            ? "Deadline countdown"
                            : "Deadline"}
                        </p>
                        {assignment.dueDate && (
                          <span className="text-xs text-gray-500">
                            {new Date(
                              assignment.dueDate,
                            ).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                        )}
                      </div>

                      <div className="mt-3">
                        <AssignmentCountdown
                          dueDate={assignment.dueDate}
                        />
                      </div>

                      {!assignment.dueDate && (
                        <p className="mt-2 text-sm text-gray-500">
                          No deadline has been set for this assignment.
                        </p>
                      )}
                    </div>

                    {/* Submission summary */}
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                          ✓
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800">
                            Submissions
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            Students marked submitted
                          </p>
                        </div>
                      </div>
                      <span className="text-xl font-bold tabular-nums text-gray-900">
                        {assignment._count?.submissions ?? 0}
                      </span>
                    </div>

                    {/* Attachments */}
                    <div className="mt-5 border-t border-gray-100 pt-4">
                      <AssignmentAttachments
                        assignmentId={assignment.id}
                        isAdmin={true}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && filteredAssignments.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50/70 px-5 py-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span>
                Showing {filteredAssignments.length} of {assignments.length}{" "}
                assignments
              </span>
              <span>
                {upcomingCount} upcoming · {overdueCount} past deadline
                {overdueCount === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </section>
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-950/50 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowForm(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="assignment-form-title"
            className="my-auto max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/70 bg-white shadow-2xl shadow-black/20"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-100 bg-white/95 px-5 py-5 backdrop-blur sm:px-7">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-700">
                  <span className="h-2 w-2 rounded-full bg-red-600" />
                  Assignment details
                </div>
                <h2
                  id="assignment-form-title"
                  className="mt-2 text-2xl font-bold tracking-tight text-gray-950"
                >
                  {editingId ? "Edit assignment" : "Create assignment"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Configure coursework, instructions, deadlines, and files.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
                aria-label="Close form"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-7">
              <div>
                <label
                  htmlFor="assignment-title"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Assignment title <span className="text-red-600">*</span>
                </label>
                <input
                  id="assignment-title"
                  required
                  maxLength={200}
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="e.g. Operating System Homework 1"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                />
              </div>

              <div>
                <label
                  htmlFor="assignment-course"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Course <span className="text-red-600">*</span>
                </label>
                <select
                  id="assignment-course"
                  required
                  value={form.courseId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      courseId: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} — {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="assignment-description"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Instructions and description
                  </label>
                  <span className="text-xs text-gray-400">
                    {form.description.length}/5000
                  </span>
                </div>
                <textarea
                  id="assignment-description"
                  rows={4}
                  maxLength={5000}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Explain the task, requirements, and submission instructions..."
                  className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-gray-400 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                />
              </div>

              <div>
                <label
                  htmlFor="assignment-deadline"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Deadline
                </label>
                <input
                  id="assignment-deadline"
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      dueDate: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
                />
                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Leave empty if this assignment has no deadline.
                </p>
              </div>

              {/* Attachments */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-lg text-red-700">
                    ↑
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Assignment attachments
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Add instructions, PDFs, documents, or other supporting
                      files. Maximum 100 MB per file.
                    </p>
                  </div>
                </div>

                <label
                  htmlFor="assignment-attachments"
                  className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white px-4 py-6 text-center transition hover:border-red-300 hover:bg-red-50/30"
                >
                  <span className="text-sm font-semibold text-gray-800">
                    Click to choose files
                  </span>
                  <span className="mt-1 text-xs text-gray-400">
                    You can select multiple files
                  </span>
                </label>

                <input
                  id="assignment-attachments"
                  type="file"
                  multiple
                  disabled={saving}
                  onChange={handleFileSelection}
                  className="sr-only"
                />

                {pendingFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-600">
                      Selected files ({pendingFiles.length})
                    </p>

                    {pendingFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${file.size}-${index}`}
                        className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xs font-bold text-red-700">
                          FILE
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="break-all text-sm font-medium text-gray-800">
                            {file.name}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => removePendingFile(index)}
                          className="shrink-0 rounded-lg px-2.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {uploadProgress && (
                  <div
                    role="status"
                    className="mt-4 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-3 py-3 text-sm text-red-800"
                  >
                    <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-red-200 border-t-red-700" />
                    <span>{uploadProgress}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || courses.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#B91C1C] focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Saving...
                    </>
                  ) : editingId ? (
                    "Save changes"
                  ) : (
                    "Create assignment"
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon,
  iconStyle,
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: string;
  iconStyle: string;
}) {
  return (
    <div className="group rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-red-100 hover:shadow-lg hover:shadow-gray-900/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
            {value}
          </p>
        </div>
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-bold transition ${iconStyle}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-xs text-gray-400">{detail}</p>
    </div>
  );
}
