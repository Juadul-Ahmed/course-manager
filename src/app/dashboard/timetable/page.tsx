
"use client";

import { useCallback, useEffect, useState } from "react";

type Course = {
  id: string;
  title: string;
  code?: string | null;
};

type TimetableEntry = {
  id: string;
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  instructor: string | null;
  notes: string | null;
  courseId: string;
  course: Course;
};

type TimetableForm = {
  title: string;
  courseId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  instructor: string;
  notes: string;
};

const weekdays = [
  { value: 1, label: "Monday", short: "MON" },
  { value: 2, label: "Tuesday", short: "TUE" },
  { value: 3, label: "Wednesday", short: "WED" },
  { value: 4, label: "Thursday", short: "THU" },
  { value: 5, label: "Friday", short: "FRI" },
];

const emptyForm: TimetableForm = {
  title: "",
  courseId: "",
  dayOfWeek: "1",
  startTime: "09:00",
  endTime: "10:30",
  room: "",
  instructor: "",
  notes: "",
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-100";

async function readError(response: Response, fallback: string) {
  const data = await response.json().catch(() => null);
  return typeof data?.error === "string" ? data.error : fallback;
}

export default function TimetablePage() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | "all">("all");
  const [form, setForm] = useState<TimetableForm>(emptyForm);
  const [formError, setFormError] = useState("");

  
const loadData = useCallback(async () => {
  setPageError("");

  try {
    const [timetableResponse, coursesResponse] = await Promise.all([
      fetch("/api/timetable", { cache: "no-store" }),
      fetch("/api/courses", { cache: "no-store" }),
    ]);

    if (!timetableResponse.ok) {
      throw new Error(
        await readError(timetableResponse, "Could not load timetable."),
      );
    }

    if (!coursesResponse.ok) {
      throw new Error(
        await readError(coursesResponse, "Could not load courses."),
      );
    }

    const timetableData = await timetableResponse.json();
    const coursesData = await coursesResponse.json();

    const timetableList = Array.isArray(timetableData)
      ? timetableData
      : timetableData.entries;

    const courseList = Array.isArray(coursesData)
      ? coursesData
      : coursesData.courses;

    if (!Array.isArray(timetableList) || !Array.isArray(courseList)) {
      throw new Error("Unexpected API response format.");
    }

    setEntries(
      timetableList.filter(
        (entry: TimetableEntry) =>
          entry.dayOfWeek >= 1 && entry.dayOfWeek <= 5,
      ),
    );

    setCourses(courseList);
  } catch (error) {
    setPageError(
      error instanceof Error ? error.message : "Failed to load timetable.",
    );
  }
}, []);


  
useEffect(() => {
  let cancelled = false;

  async function fetchInitialData() {
    try {
      const [timetableResponse, coursesResponse] = await Promise.all([
        fetch("/api/timetable", { cache: "no-store" }),
        fetch("/api/courses", { cache: "no-store" }),
      ]);

      if (!timetableResponse.ok) {
        throw new Error(
          await readError(timetableResponse, "Could not load timetable."),
        );
      }

      if (!coursesResponse.ok) {
        throw new Error(
          await readError(coursesResponse, "Could not load courses."),
        );
      }

      const timetableData = await timetableResponse.json();
      const coursesData = await coursesResponse.json();

      const timetableList = Array.isArray(timetableData)
        ? timetableData
        : timetableData.entries;

      const courseList = Array.isArray(coursesData)
        ? coursesData
        : coursesData.courses;

      if (!Array.isArray(timetableList) || !Array.isArray(courseList)) {
        throw new Error("Unexpected API response format.");
      }

      if (!cancelled) {
        setEntries(
          timetableList.filter(
            (entry: TimetableEntry) =>
              entry.dayOfWeek >= 1 && entry.dayOfWeek <= 5,
          ),
        );
        setCourses(courseList);
      }
    } catch (error) {
      if (!cancelled) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Failed to load timetable.",
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  void fetchInitialData();

  return () => {
    cancelled = true;
  };
}, []);


  function openCreateModal() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      courseId: courses[0]?.id ?? "",
    });
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(entry: TimetableEntry) {
    setEditingId(entry.id);
    setForm({
      title: entry.title,
      courseId: entry.courseId,
      dayOfWeek: String(entry.dayOfWeek),
      startTime: entry.startTime,
      endTime: entry.endTime,
      room: entry.room ?? "",
      instructor: entry.instructor ?? "",
      notes: entry.notes ?? "",
    });
    setFormError("");
    setModalOpen(true);
  }

  function updateField(
    field: keyof TimetableForm,
    value: string,
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!form.title.trim() || !form.courseId) {
      setFormError("Please enter a class title and select a course.");
      return;
    }

    if (form.startTime >= form.endTime) {
      setFormError("The end time must be later than the start time.");
      return;
    }

    setSaving(true);

    try {
      const url = editingId
        ? `/api/timetable/${editingId}`
        : "/api/timetable";

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          title: form.title.trim(),
          dayOfWeek: Number(form.dayOfWeek),
          room: form.room.trim(),
          instructor: form.instructor.trim(),
          notes: form.notes.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(
          await readError(response, "Could not save the class."),
        );
      }

      setModalOpen(false);
      await loadData();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not save the class.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry: TimetableEntry) {
    const confirmed = window.confirm(
      `Delete "${entry.title}" from the timetable?`,
    );

    if (!confirmed) return;

    setDeletingId(entry.id);
    setPageError("");

    try {
      const response = await fetch(`/api/timetable/${entry.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(
          await readError(response, "Could not delete the class."),
        );
      }

      await loadData();
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Could not delete the class.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const visibleDays =
    selectedDay === "all"
      ? weekdays
      : weekdays.filter((day) => day.value === selectedDay);

  const totalClasses = entries.length;
  const totalCourses = new Set(entries.map((entry) => entry.courseId)).size;
  const totalHours = entries.reduce((total, entry) => {
    const [startHour, startMinute] = entry.startTime.split(":").map(Number);
    const [endHour, endMinute] = entry.endTime.split(":").map(Number);
    return total + (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60;
  }, 0);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        {/* Page heading */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <a
              href="/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-red-600"
            >
              <span aria-hidden="true">←</span>
              Back to Dashboard
            </a>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              Academic Planner
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Class Timetable
            </h1>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              Organize your classes from Monday to Friday.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={courses.length === 0}
          >
            <span className="text-lg leading-none">+</span>
            Add Class
          </button>
        </div>

        {/* Summary cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Scheduled Classes"
            value={String(totalClasses)}
            detail="Monday–Friday"
            icon="▦"
          />
          <SummaryCard
            label="Courses in Timetable"
            value={String(totalCourses)}
            detail="Distinct courses"
            icon="▤"
          />
          <SummaryCard
            label="Scheduled Hours"
            value={`${Number(totalHours.toFixed(1))}h`}
            detail="Total weekly duration"
            icon="◷"
          />
        </section>

        {/* API feedback */}
        {pageError && (
          <div
            role="alert"
            className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p>{pageError}</p>
            <button
              type="button"
              onClick={() => void loadData()}
              className="shrink-0 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && courses.length === 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <p className="font-semibold">No courses found</p>
            <p className="mt-1">
              Create a course first. You can then assign it to a timetable
              entry.
            </p>
            <a
              href="/dashboard/courses"
              className="mt-3 inline-flex font-semibold underline"
            >
              Go to Courses →
            </a>
          </div>
        )}

        {/* Timetable */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-bold">Weekly Schedule</h2>
              <p className="mt-1 text-sm text-gray-500">
                View and manage your scheduled classes.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedDay("all")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  selectedDay === "all"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All days
              </button>

              {weekdays.map((day) => (
                <button
                  type="button"
                  key={day.value}
                  onClick={() => setSelectedDay(day.value)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    selectedDay === day.value
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {day.short}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 p-6">
              <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
              <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
              <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
            </div>
          ) : (
            <div className="grid grid-cols-1 divide-y divide-gray-100 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-5">
              {visibleDays.map((day) => {
                const dayEntries = entries
                  .filter((entry) => entry.dayOfWeek === day.value)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));

                return (
                  <div key={day.value} className="min-w-0">
                    <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-4">
                      <p className="text-xs font-bold tracking-widest text-gray-400">
                        {day.short}
                      </p>
                      <h3 className="mt-1 font-semibold text-gray-800">
                        {day.label}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {dayEntries.length}{" "}
                        {dayEntries.length === 1 ? "class" : "classes"}
                      </p>
                    </div>

                    <div className="min-h-52 space-y-3 p-3">
                      {dayEntries.length === 0 ? (
                        <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 px-3 text-center">
                          <span className="text-2xl text-gray-300">＋</span>
                          <p className="mt-2 text-xs font-medium text-gray-500">
                            No classes scheduled
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDay(day.value);
                              setEditingId(null);
                              setForm({
                                ...emptyForm,
                                dayOfWeek: String(day.value),
                                courseId: courses[0]?.id ?? "",
                              });
                              setFormError("");
                              setModalOpen(true);
                            }}
                            disabled={courses.length === 0}
                            className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            Add a class
                          </button>
                        </div>
                      ) : (
                        dayEntries.map((entry) => (
                          <article
                            key={entry.id}
                            className="group rounded-xl border border-red-100 bg-red-50/60 p-3.5 transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-sm"
                          >
                            <div className="mb-3 flex items-start justify-between gap-2">
                              <span className="rounded-md bg-white px-2 py-1 text-[11px] font-bold text-red-700 ring-1 ring-red-100">
                                {entry.startTime}–{entry.endTime}
                              </span>
                              <span className="text-xs text-gray-400">
                                {entry.room || "No room"}
                              </span>
                            </div>

                            <h4 className="break-words text-sm font-bold text-gray-900">
                              {entry.title}
                            </h4>

                            <p className="mt-1 break-words text-xs text-gray-600">
                              {entry.course?.title ?? "Course"}
                            </p>

                            {entry.course?.code && (
                              <p className="mt-1 text-[11px] font-medium text-gray-400">
                                {entry.course.code}
                              </p>
                            )}

                            {entry.instructor && (
                              <p className="mt-3 text-xs text-gray-500">
                                Instructor: {entry.instructor}
                              </p>
                            )}

                            {entry.notes && (
                              <p className="mt-2 whitespace-pre-wrap break-words text-xs text-gray-500">
                                {entry.notes}
                              </p>
                            )}

                            <div className="mt-4 flex gap-3 border-t border-red-100 pt-3">
                              <button
                                type="button"
                                onClick={() => openEditModal(entry)}
                                className="text-xs font-semibold text-gray-600 transition hover:text-red-600"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDelete(entry)}
                                disabled={deletingId === entry.id}
                                className="text-xs font-semibold text-red-600 transition hover:text-red-800 disabled:opacity-50"
                              >
                                {deletingId === entry.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <p className="text-center text-xs text-gray-400">
          Timetable entries are saved to your database.
        </p>
      </div>

      {/* Create / Edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setModalOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="timetable-modal-title"
            className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-red-600">
                  Class Details
                </p>
                <h2
                  id="timetable-modal-title"
                  className="mt-1 text-xl font-bold"
                >
                  {editingId ? "Edit Class" : "Add a Class"}
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close modal"
                disabled={saving}
                onClick={() => setModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500 transition hover:bg-gray-200"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <label className="text-sm font-semibold text-gray-700 sm:col-span-2">
                  Class title <span className="text-red-600">*</span>
                  <input
                    required
                    maxLength={150}
                    value={form.title}
                    onChange={(event) =>
                      updateField("title", event.target.value)
                    }
                    placeholder="e.g. Introduction to Programming"
                    className={inputClass}
                  />
                </label>

                <label className="text-sm font-semibold text-gray-700 sm:col-span-2">
                  Course <span className="text-red-600">*</span>
                  <select
                    required
                    value={form.courseId}
                    onChange={(event) =>
                      updateField("courseId", event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code ? `${course.code} — ` : ""}
                        {course.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold text-gray-700">
                  Day <span className="text-red-600">*</span>
                  <select
                    required
                    value={form.dayOfWeek}
                    onChange={(event) =>
                      updateField("dayOfWeek", event.target.value)
                    }
                    className={inputClass}
                  >
                    {weekdays.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold text-gray-700">
                  Room
                  <input
                    maxLength={100}
                    value={form.room}
                    onChange={(event) =>
                      updateField("room", event.target.value)
                    }
                    placeholder="e.g. Room 204"
                    className={inputClass}
                  />
                </label>

                <label className="text-sm font-semibold text-gray-700">
                  Start time <span className="text-red-600">*</span>
                  <input
                    required
                    type="time"
                    value={form.startTime}
                    onChange={(event) =>
                      updateField("startTime", event.target.value)
                    }
                    className={inputClass}
                  />
                </label>

                <label className="text-sm font-semibold text-gray-700">
                  End time <span className="text-red-600">*</span>
                  <input
                    required
                    type="time"
                    value={form.endTime}
                    onChange={(event) =>
                      updateField("endTime", event.target.value)
                    }
                    className={inputClass}
                  />
                </label>

                <label className="text-sm font-semibold text-gray-700 sm:col-span-2">
                  Instructor
                  <input
                    maxLength={150}
                    value={form.instructor}
                    onChange={(event) =>
                      updateField("instructor", event.target.value)
                    }
                    placeholder="Instructor name"
                    className={inputClass}
                  />
                </label>

                <label className="text-sm font-semibold text-gray-700 sm:col-span-2">
                  Notes
                  <textarea
                    rows={3}
                    maxLength={2000}
                    value={form.notes}
                    onChange={(event) =>
                      updateField("notes", event.target.value)
                    }
                    placeholder="Optional class notes..."
                    className={inputClass}
                  />
                </label>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {formError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || courses.length === 0}
                  className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Add Class"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: string;
}) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
            {value}
          </p>
          <p className="mt-2 text-xs text-gray-400">{detail}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-xl text-red-600">
          {icon}
        </div>
      </div>
    </article>
  );
}
