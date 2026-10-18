"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Course = {
  id: string;
  title: string;
  code: string;
  description: string | null;
  createdAt: string;
  _count?: {
    assignments: number;
    files: number;
  };
};

type CourseForm = {
  title: string;
  code: string;
  description: string;
};

const initialForm: CourseForm = {
  title: "",
  code: "",
  description: "",
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<CourseForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Fetch courses from the API.
  const fetchCourses = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch("/api/courses");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load courses.");
      }

      if (!Array.isArray(data)) {
        throw new Error("The server returned an invalid course list.");
      }

      setCourses(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  // Initial fetch. This is the only useEffect on this page.
  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      try {
        const response = await fetch("/api/courses");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load courses.");
        }

        if (!Array.isArray(data)) {
          throw new Error("The server returned an invalid course list.");
        }

        if (!cancelled) {
          setCourses(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCourses();

    return () => {
      cancelled = true;
    };
  }, []);

  function openCreateModal() {
    setForm({ ...initialForm });
    setEditingId(null);
    setError("");
    setModalOpen(true);
  }

  function openEditModal(course: Course) {
    setForm({
      title: course.title,
      code: course.code,
      description: course.description ?? "",
    });

    setEditingId(course.id);
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setForm({ ...initialForm });
    setEditingId(null);
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        editingId ? `/api/courses/${editingId}` : "/api/courses",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: form.title.trim(),
            code: form.code.trim().toUpperCase(),
            description: form.description.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save course.");
      }

      setModalOpen(false);
      setForm({ ...initialForm });
      setEditingId(null);

      await fetchCourses();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(course: Course) {
    const confirmed = window.confirm(
      `Delete "${course.title}" (${course.code})? Associated assignments and submissions will also be deleted.`
    );

    if (!confirmed || deletingId) return;

    setDeletingId(course.id);
    setError("");

    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete course.");
      }

      await fetchCourses();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredCourses = courses.filter((course) => {
    const query = search.trim().toLowerCase();

    return (
      course.title.toLowerCase().includes(query) ||
      course.code.toLowerCase().includes(query) ||
      (course.description ?? "").toLowerCase().includes(query)
    );
  });

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-6 text-gray-900 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Page header */}
        <header className="mb-8">
          <Link
            href="/dashboard"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#DC2626]"
          >
            <span aria-hidden="true">←</span>
            Back to Dashboard
          </Link>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-3 py-1.5 text-xs font-semibold text-[#DC2626]">
                <span className="h-2 w-2 rounded-full bg-[#DC2626]" />
                ACADEMIC MANAGEMENT
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Course Management
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
                Organize your courses, manage course details, and keep
                assignments and learning materials in one place.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#B91C1C] focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
            >
              <span className="text-xl leading-none">+</span>
              Add New Course
            </button>
          </div>
        </header>

        {/* Statistics */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="group rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Courses
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
                  {courses.length}
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  All courses in your system
                </p>
              </div>

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-2xl text-[#DC2626] transition group-hover:bg-red-100">
                ▤
              </div>
            </div>
          </div>

          <div className="group rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Courses Displayed
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
                  {filteredCourses.length}
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  Courses matching your search
                </p>
              </div>

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-2xl text-gray-600 transition group-hover:bg-red-50 group-hover:text-[#DC2626]">
                ⌕
              </div>
            </div>
          </div>
        </section>

        {/* Courses */}
        <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  All Courses
                </h2>
                <p className="mt-1.5 text-sm text-gray-500">
                  View and manage every course in your system.
                </p>
              </div>

              <div className="flex w-full gap-2 lg:max-w-md">
                <div className="relative min-w-0 flex-1">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-gray-400">
                    ⌕
                  </span>

                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by title, code, or description..."
                    aria-label="Search courses"
                    className="min-h-11 w-full rounded-xl border border-gray-200 bg-[#F8FAFC] py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-50"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void fetchCourses(true)}
                  disabled={loading}
                  className="min-h-11 shrink-0 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-[#DC2626] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Refresh courses"
                  title="Refresh courses"
                >
                  ↻
                </button>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {error && !modalOpen && (
              <div
                role="alert"
                className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError("")}
                  aria-label="Dismiss error"
                  className="font-bold"
                >
                  ×
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#DC2626]" />
                <p className="mt-4 text-sm text-gray-500">
                  Loading your courses...
                </p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-[#FAFAFA] px-5 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl text-[#DC2626]">
                  ▤
                </div>

                <h3 className="mt-5 font-bold text-gray-900">
                  {search ? "No matching courses" : "No courses yet"}
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                  {search
                    ? "Try a different search term to find your course."
                    : "Create your first course to start organizing assignments and learning materials."}
                </p>

                {!search && (
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="mt-6 rounded-xl bg-[#DC2626] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#B91C1C]"
                  >
                    + Create Your First Course
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredCourses.map((course) => (
                  <article
                    key={course.id}
                    className="group flex min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg hover:shadow-gray-200/60"
                  >
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-2xl text-[#DC2626] transition group-hover:bg-[#DC2626] group-hover:text-white">
                        ▤
                      </div>

                      <span className="max-w-[65%] truncate rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-bold tracking-wide text-[#B91C1C]">
                        {course.code}
                      </span>
                    </div>

                    <h3 className="break-words text-lg font-bold text-gray-900">
                      {course.title}
                    </h3>

                    <p className="mt-2 min-h-12 whitespace-pre-wrap break-words text-sm leading-6 text-gray-500">
                      {course.description || "No description provided."}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#F8FAFC] p-3">
                        <p className="text-lg font-bold text-gray-900">
                          {course._count?.assignments ?? 0}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Assignments
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#F8FAFC] p-3">
                        <p className="text-lg font-bold text-gray-900">
                          {course._count?.files ?? 0}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Files
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                      <span className="text-xs text-gray-400">
                        Created{" "}
                        {new Date(course.createdAt).toLocaleDateString()}
                      </span>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(course)}
                          disabled={deletingId === course.id}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-[#B91C1C] disabled:opacity-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDelete(course)}
                          disabled={deletingId !== null}
                          className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === course.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <footer className="py-6 text-center text-xs text-gray-400">
          Course Management · Keep your learning organized
        </footer>
      </div>

      {/* Create/Edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-modal-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-xl text-[#DC2626]">
                  ▤
                </div>

                <h2
                  id="course-modal-title"
                  className="text-xl font-bold text-gray-900"
                >
                  {editingId ? "Edit Course" : "Create a Course"}
                </h2>

                <p className="mt-1.5 text-sm text-gray-500">
                  Enter the details for your course below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
                className="rounded-lg px-2 py-1 text-2xl leading-none text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="course-title"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Course Title <span className="text-red-600">*</span>
                </label>

                <input
                  id="course-title"
                  required
                  maxLength={200}
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  placeholder="e.g. Introduction to Programming"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-red-300 focus:ring-4 focus:ring-red-50"
                />
              </div>

              <div>
                <label
                  htmlFor="course-code"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Course Code <span className="text-red-600">*</span>
                </label>

                <input
                  id="course-code"
                  required
                  maxLength={50}
                  value={form.code}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      code: event.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g. CS101"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm uppercase outline-none transition placeholder:text-gray-400 focus:border-red-300 focus:ring-4 focus:ring-red-50"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Each course must have a unique code.
                </p>
              </div>

              <div>
                <label
                  htmlFor="course-description"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Description
                </label>

                <textarea
                  id="course-description"
                  rows={4}
                  maxLength={2000}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="What will students learn in this course?"
                  className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-red-300 focus:ring-4 focus:ring-red-50"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={closeModal}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#DC2626] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Create Course"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}