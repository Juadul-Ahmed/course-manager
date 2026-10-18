"use client";

import {  useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Student = {
  id: string;
  name: string;
  username: string | null;
  email: string;
  role?: string;
  createdAt: string;
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");

 useEffect(() => {
  let cancelled = false;

  async function fetchStudents() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/students", {
        credentials: "same-origin",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load students.");
      }

      if (!cancelled) {
        setStudents(Array.isArray(data) ? data : (data.students ?? []));
      }
    } catch (err) {
      if (!cancelled) {
        setError(
          err instanceof Error ? err.message : "Something went wrong.",
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  void fetchStudents();

  return () => {
    cancelled = true;
  };
}, []);

async function loadStudents() {
  setLoading(true);
  setError("");

  try {
    const response = await fetch("/api/students", {
      credentials: "same-origin",
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load students.");
    }

    setStudents(Array.isArray(data) ? data : (data.students ?? []));
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Something went wrong.",
    );
  } finally {
    setLoading(false);
  }
}

  function openCreateForm() {
    setEditingStudent(null);
    setName("");
    setStudentId("");
    setPassword("");
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(student: Student) {
    setEditingStudent(student);
    setName(student.name);
    setStudentId(student.username ?? "");
    setPassword("");
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingStudent(null);
    setName("");
    setStudentId("");
    setPassword("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const isEditing = Boolean(editingStudent);

      const response = await fetch(
        isEditing
          ? `/api/students/${editingStudent!.id}`
          : "/api/students",
        {
          method: isEditing ? "PATCH" : "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            studentId: studentId.trim().toLowerCase(),
            ...(isEditing ? {} : { password }),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Failed to ${isEditing ? "update" : "create"} student.`,
        );
      }

      const savedStudent: Student = data.student ?? data;

      if (isEditing) {
        setStudents((current) =>
          current.map((student) =>
            student.id === savedStudent.id ? savedStudent : student,
          ),
        );
        setSuccess("Student updated successfully.");
      } else {
        setStudents((current) => [savedStudent, ...current]);
        setSuccess("Student created successfully.");
      }

      setShowForm(false);
      setEditingStudent(null);
      setName("");
      setStudentId("");
      setPassword("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingStudent || saving) return;

    const studentToDelete = deletingStudent;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch(
        `/api/students/${studentToDelete.id}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete student.");
      }

      setStudents((current) =>
        current.filter((student) => student.id !== studentToDelete.id),
      );

      setSuccess(`${studentToDelete.name} was deleted successfully.`);
      setDeletingStudent(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
      setDeletingStudent(null);
    } finally {
      setSaving(false);
    }
  }

  const filteredStudents = useMemo(() => {
    const query = search.toLowerCase().trim();

    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        (student.username ?? "").toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query),
    );
  }, [students, search]);

  const assignedIds = students.filter(
    (student) => Boolean(student.username?.trim()),
  ).length;

  const adminCount = students.filter(
    (student) => student.role?.toUpperCase() === "ADMIN",
  ).length;

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  }

  function getInitials(value: string) {
    return (
      value
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("") || "S"
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-6 text-gray-900 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#DC2626]" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                Course Manager
              </p>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Students
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
              Manage student accounts, organize your directory, and keep
              student information up to date.
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#B91C1C] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-red-100"
            >
              <span className="text-lg leading-none">+</span>
              Add Student
            </button>
          </div>
        </header>

        {/* Notifications */}
        {error && (
          <div
            role="alert"
            className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800"
          >
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold">
                !
              </span>
              <p className="whitespace-pre-wrap leading-6">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="rounded-lg px-2 py-1 font-bold text-red-700 transition hover:bg-red-100"
            >
              ✕
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold">
                ✓
              </span>
              <p className="leading-6">{success}</p>
            </div>

            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Dismiss success message"
              className="rounded-lg px-2 py-1 font-bold text-emerald-700 transition hover:bg-emerald-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Statistics */}
        <section
          aria-label="Student statistics"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            label="Total Students"
            value={loading ? "—" : students.length}
            detail="Student accounts in your directory"
            icon="♙"
            iconStyle="bg-red-50 text-red-600"
          />

          <StatCard
            label="Student IDs"
            value={loading ? "—" : assignedIds}
            detail="Accounts with an assigned ID"
            icon="⌘"
            iconStyle="bg-orange-50 text-orange-600"
          />

          <StatCard
            label="Admin Accounts"
            value={loading ? "—" : adminCount}
            detail="Accounts with the admin role"
            icon="♧"
            iconStyle="bg-violet-50 text-violet-600"
          />

          <StatCard
            label="Search Results"
            value={loading ? "—" : filteredStudents.length}
            detail="Students matching your search"
            icon="⌕"
            iconStyle="bg-emerald-50 text-emerald-600"
          />
        </section>

        {/* Student Directory */}
        <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5 sm:p-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-bold tracking-tight text-gray-950 sm:text-2xl">
                    All Students
                  </h2>

                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                    {loading ? "Loading..." : `${filteredStudents.length} students`}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  View and manage the accounts registered in your course
                  manager.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 sm:min-w-[260px]">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="m16 16 4 4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>

                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search students..."
                    aria-label="Search students"
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-300 focus:ring-4 focus:ring-red-50 sm:w-[260px]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void loadStudents()}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  >
                    <path
                      d="M20 7v5h-5M4 17v-5h5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M5.5 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.5-3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-100 border-t-[#DC2626]" />
              <p className="mt-4 text-sm font-medium text-gray-600">
                Loading students...
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Please wait a moment.
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            /* Empty State */
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl text-red-500">
                ♙
              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-900">
                {search.trim() ? "No students found" : "No students yet"}
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                {search.trim()
                  ? "Try another name, student ID, or email address."
                  : "Get started by creating the first student account in your directory."}
              </p>

              {search.trim() ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Clear Search
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 rounded-xl bg-[#DC2626] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#B91C1C] focus:outline-none focus:ring-4 focus:ring-red-100"
                >
                  + Add First Student
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                        Student
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                        Student ID
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                        Role
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                        Joined
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="transition hover:bg-gray-50/80"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-sm font-bold text-red-700 ring-1 ring-red-100">
                              {getInitials(student.name)}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {student.name}
                              </p>
                              <p className="mt-1 truncate text-xs text-gray-500">
                                {student.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          {student.username ? (
                            <span className="inline-flex rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 font-mono text-xs font-medium text-gray-700">
                              {student.username}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              student.role?.toUpperCase() === "ADMIN"
                                ? "bg-violet-50 text-violet-700 ring-1 ring-violet-100"
                                : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                            }`}
                          >
                            {student.role ?? "STUDENT"}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-sm text-gray-500">
                          {formatDate(student.createdAt)}
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(student)}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setError("");
                                setSuccess("");
                                setDeletingStudent(student);
                              }}
                              className="rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-3 p-4 md:hidden sm:p-5">
                {filteredStudents.map((student) => (
                  <article
                    key={student.id}
                    className="rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-red-100 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-sm font-bold text-red-700 ring-1 ring-red-100">
                        {getInitials(student.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-sm font-bold text-gray-900">
                          {student.name}
                        </h3>
                        <p className="mt-1 break-all text-xs leading-5 text-gray-500">
                          {student.email}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              student.role?.toUpperCase() === "ADMIN"
                                ? "bg-violet-50 text-violet-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {student.role ?? "STUDENT"}
                          </span>

                          <span className="text-xs text-gray-400">
                            Joined {formatDate(student.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          Student ID
                        </p>
                        <p className="mt-1 truncate font-mono text-xs text-gray-700">
                          {student.username || "Not assigned"}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(student)}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setError("");
                            setSuccess("");
                            setDeletingStudent(student);
                          }}
                          className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {/* Directory Footer */}
          {!loading && filteredStudents.length > 0 && (
            <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4 sm:px-7">
              <p className="text-xs text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {filteredStudents.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-700">
                  {students.length}
                </span>{" "}
                students
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Create / Edit Student Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-form-title"
            className="my-auto w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-5 sm:px-7">
              <div>
                <div className="mb-2 inline-flex rounded-xl bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
                  {editingStudent ? "UPDATE ACCOUNT" : "NEW ACCOUNT"}
                </div>

                <h2
                  id="student-form-title"
                  className="text-xl font-bold tracking-tight text-gray-950 sm:text-2xl"
                >
                  {editingStudent ? "Edit Student" : "Add Student"}
                </h2>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  {editingStudent
                    ? "Update the student's account information."
                    : "Create a new student account for your directory."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
              <div>
                <label
                  htmlFor="student-name"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Full Name <span className="text-red-600">*</span>
                </label>

                <input
                  id="student-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter student's full name"
                  autoComplete="name"
                  required
                  maxLength={100}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-300 focus:ring-4 focus:ring-red-50"
                />
              </div>

              <div>
                <label
                  htmlFor="student-id"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Student ID <span className="text-red-600">*</span>
                </label>

                <input
                  id="student-id"
                  type="text"
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                  placeholder="e.g. student001"
                  autoComplete="username"
                  required
                  minLength={3}
                  maxLength={50}
                  pattern="[a-zA-Z0-9._]{3,50}"
                  title="Use 3–50 letters, numbers, periods, or underscores."
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-300 focus:ring-4 focus:ring-red-50"
                />

                <p className="mt-2 text-xs leading-5 text-gray-400">
                  Use 3–50 letters, numbers, periods, or underscores. The ID
                  will be converted to lowercase.
                </p>
              </div>

              {!editingStudent && (
                <div>
                  <label
                    htmlFor="student-password"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Initial Password <span className="text-red-600">*</span>
                  </label>

                  <input
                    id="student-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create an initial password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-300 focus:ring-4 focus:ring-red-50"
                  />

                  <p className="mt-2 text-xs leading-5 text-gray-400">
                    Use at least 8 characters.
                  </p>
                </div>
              )}

              {editingStudent && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs leading-5 text-amber-800">
                    The existing password will remain unchanged.
                  </p>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#B91C1C] focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {saving
                    ? "Saving..."
                    : editingStudent
                      ? "Save Changes"
                      : "Create Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-gray-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setDeletingStudent(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-student-title"
            className="my-auto w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-xl text-red-600 ring-1 ring-red-100">
              !
            </div>

            <h2
              id="delete-student-title"
              className="mt-5 text-xl font-bold tracking-tight text-gray-950"
            >
              Delete Student?
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                {deletingStudent.name}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                disabled={saving}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {saving ? "Deleting..." : "Delete Student"}
              </button>
            </div>
          </div>
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
    <div className="group rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-red-100 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{label}</p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
            {value}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl transition group-hover:scale-105 ${iconStyle}`}
        >
          <span aria-hidden="true">{icon}</span>
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-gray-500">{detail}</p>
    </div>
  );
}