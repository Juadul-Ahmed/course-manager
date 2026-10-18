
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiBookOpen,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";

type Course = {
  id: string;
  title: string;
  code: string;
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

const DAYS = [
  { value: 1, name: "Monday", short: "MON" },
  { value: 2, name: "Tuesday", short: "TUE" },
  { value: 3, name: "Wednesday", short: "WED" },
  { value: 4, name: "Thursday", short: "THU" },
  { value: 5, name: "Friday", short: "FRI" },
];

const COLORS = [
  "border-l-rose-700 bg-rose-50",
  "border-l-amber-600 bg-amber-50",
  "border-l-emerald-700 bg-emerald-50",
  "border-l-sky-700 bg-sky-50",
  "border-l-violet-700 bg-violet-50",
];

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return time;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getWeekStart(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const difference = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + difference);
  result.setHours(0, 0, 0, 0);

  return result;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function isSameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export default function StudentTimetablePage() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  
const fetchTimetable = useCallback(async () => {
  setError("");

  try {
    const response = await fetch("/api/student/timetable", {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to load your timetable."
      );
    }

    if (!Array.isArray(data)) {
      throw new Error("The timetable response has an invalid format.");
    }

    setEntries(data);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Something went wrong while loading your timetable."
    );
  }
}, []);

useEffect(() => {
  let cancelled = false;

  async function loadTimetable() {
    try {
      const response = await fetch("/api/student/timetable", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load your timetable."
        );
      }

      if (!Array.isArray(data)) {
        throw new Error("The timetable response has an invalid format.");
      }

      if (!cancelled) {
        setEntries(data);
        setError("");
      }
    } catch (err) {
      if (!cancelled) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading your timetable."
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  void loadTimetable();

  return () => {
    cancelled = true;
  };
}, []);


  const weekStart = useMemo(() => {
    const monday = getWeekStart(new Date());

    monday.setDate(monday.getDate() + weekOffset * 7);

    return monday;
  }, [weekOffset]);

  const weekDays = useMemo(() => {
    return DAYS.map((day, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);

      return {
        ...day,
        date,
        isToday: isSameDay(date, new Date()),
      };
    });
  }, [weekStart]);

  const visibleEntries = useMemo(() => {
    return entries.filter(
      (entry) => entry.dayOfWeek >= 1 && entry.dayOfWeek <= 5,
    );
  }, [entries]);

  const selectedEntries = useMemo(() => {
    if (selectedDay === null) {
      return visibleEntries;
    }

    return visibleEntries.filter(
      (entry) => entry.dayOfWeek === selectedDay,
    );
  }, [visibleEntries, selectedDay]);

  const totalClasses = visibleEntries.length;
  const totalCourses = new Set(
    visibleEntries.map((entry) => entry.courseId),
  ).size;

  const todayValue = (() => {
    const day = new Date().getDay();
    return day >= 1 && day <= 5 ? day : null;
  })();

  const todayClasses = todayValue
    ? visibleEntries.filter(
        (entry) => entry.dayOfWeek === todayValue,
      ).length
    : 0;

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 4);

  return (
    <main className="min-h-screen bg-[#faf8f6] px-4 py-6 text-[#292321] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        {/* Header */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#8b292f]">
              <FiCalendar size={16} />
              <span>Student Portal</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              My Timetable
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#827975] sm:text-base">
              Keep track of your classes, instructors, rooms, and
              weekly schedule in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchTimetable}
            disabled={loading}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-[#e9dfda] bg-white px-4 py-2.5 text-sm font-semibold transition hover:border-[#8b292f] hover:text-[#8b292f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiRefreshCw
              className={loading ? "animate-spin" : ""}
              size={16}
            />
            Refresh
          </button>
        </section>

        {/* Summary cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#eee5df] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#827975]">
                  Classes this week
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {loading ? "—" : totalClasses}
                </p>
              </div>

              <div className="rounded-xl bg-[#f8e9e8] p-3 text-[#8b292f]">
                <FiCalendar size={22} />
              </div>
            </div>
            <p className="mt-3 text-xs text-[#a19893]">
              Monday to Friday
            </p>
          </div>

          <div className="rounded-2xl border border-[#eee5df] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#827975]">
                  Scheduled courses
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {loading ? "—" : totalCourses}
                </p>
              </div>

              <div className="rounded-xl bg-[#f7efe0] p-3 text-[#96651b]">
                <FiBookOpen size={22} />
              </div>
            </div>
            <p className="mt-3 text-xs text-[#a19893]">
              Different courses in your timetable
            </p>
          </div>

          <div className="rounded-2xl border border-[#eee5df] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#827975]">
                  Today&apos;s classes
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {loading ? "—" : todayClasses}
                </p>
              </div>

              <div className="rounded-xl bg-[#e8f2e9] p-3 text-[#347449]">
                <FiClock size={22} />
              </div>
            </div>
            <p className="mt-3 text-xs text-[#a19893]">
              {todayValue
                ? "Classes scheduled for today"
                : "No weekday classes today"}
            </p>
          </div>
        </section>

        {/* Week navigation */}
        <section className="rounded-2xl border border-[#eee5df] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">Weekly schedule</h2>
              <p className="mt-1 text-sm text-[#827975]">
                {formatDate(weekStart)} – {formatDate(weekEnd)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWeekOffset((current) => current - 1)}
                aria-label="Previous week"
                className="rounded-xl border border-[#e9dfda] p-2.5 transition hover:bg-[#faf5f2]"
              >
                <FiChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setWeekOffset(0);
                  setSelectedDay(null);
                }}
                className="rounded-xl border border-[#e9dfda] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#faf5f2]"
              >
                This week
              </button>

              <button
                type="button"
                onClick={() => setWeekOffset((current) => current + 1)}
                aria-label="Next week"
                className="rounded-xl border border-[#e9dfda] p-2.5 transition hover:bg-[#faf5f2]"
              >
                <FiChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Day selector */}
          <div className="mt-5 grid grid-cols-5 gap-2">
            {weekDays.map((day) => {
              const isSelected = selectedDay === day.value;

              const dayCount = visibleEntries.filter(
                (entry) => entry.dayOfWeek === day.value,
              ).length;

              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() =>
                    setSelectedDay((current) =>
                      current === day.value ? null : day.value,
                    )
                  }
                  className={`rounded-xl border px-1 py-3 text-center transition sm:px-3 ${
                    isSelected
                      ? "border-[#8b292f] bg-[#8b292f] text-white"
                      : day.isToday
                        ? "border-[#d8b2b3] bg-[#fbf1f0]"
                        : "border-[#eee5df] bg-white hover:bg-[#faf5f2]"
                  }`}
                >
                  <span className="block text-[10px] font-bold tracking-wide sm:text-xs">
                    {day.short}
                  </span>

                  <span className="mt-1 block text-lg font-bold">
                    {day.date.getDate()}
                  </span>

                  <span
                    className={`mt-1 block text-[10px] ${
                      isSelected ? "text-white/80" : "text-[#a19893]"
                    }`}
                  >
                    {dayCount} {dayCount === 1 ? "class" : "classes"}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-xs text-[#a19893]">
            Select a day to filter classes. Select it again to show the
            full Monday–Friday schedule.
          </p>
        </section>

        {/* Timetable content */}
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                {selectedDay !== null
                  ? DAYS.find((day) => day.value === selectedDay)?.name
                  : "All weekday classes"}
              </h2>
              <p className="mt-1 text-sm text-[#827975]">
                {selectedEntries.length}{" "}
                {selectedEntries.length === 1 ? "class" : "classes"}{" "}
                scheduled
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800"
            >
              <FiAlertCircle className="mt-0.5 shrink-0" size={20} />
              <div className="flex-1">
                <p className="font-semibold">
                  Could not load your timetable
                </p>
                <p className="mt-1 text-sm">{error}</p>
                <button
                  type="button"
                  onClick={fetchTimetable}
                  className="mt-3 text-sm font-bold underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-2xl border border-[#eee5df] bg-white p-5"
                >
                  <div className="h-4 w-24 rounded bg-[#eee5df]" />
                  <div className="mt-4 h-6 w-3/4 rounded bg-[#eee5df]" />
                  <div className="mt-3 h-4 w-1/2 rounded bg-[#f2ece8]" />
                  <div className="mt-6 h-16 rounded-xl bg-[#f7f2ef]" />
                </div>
              ))}
            </div>
          ) : !error && selectedEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#dfd2ca] bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8e9e8] text-[#8b292f]">
                <FiCalendar size={25} />
              </div>

              <h3 className="mt-4 text-lg font-bold">
                No classes scheduled
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#827975]">
                There are no timetable entries to display for this
                selection. Your classes will appear here once they have
                been added.
              </p>

              {selectedDay !== null && (
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="mt-5 rounded-xl bg-[#8b292f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#702127]"
                >
                  View all weekdays
                </button>
              )}
            </div>
          ) : !error ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {selectedEntries
                .slice()
                .sort((a, b) => {
                  if (a.dayOfWeek !== b.dayOfWeek) {
                    return a.dayOfWeek - b.dayOfWeek;
                  }

                  return a.startTime.localeCompare(b.startTime);
                })
                .map((entry, index) => {
                  const day = DAYS.find(
                    (item) => item.value === entry.dayOfWeek,
                  );

                  const colorClass = COLORS[index % COLORS.length];

                  return (
                    <article
                      key={entry.id}
                      className="group overflow-hidden rounded-2xl border border-[#eee5df] bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-l-4 ${colorClass}`}
                          >
                            <FiBookOpen
                              className="text-[#51423d]"
                              size={20}
                            />
                          </div>

                          <span className="rounded-full bg-[#f8e9e8] px-3 py-1 text-xs font-bold text-[#8b292f]">
                            {day?.short ?? "CLASS"}
                          </span>
                        </div>

                        <h3 className="mt-4 text-lg font-bold leading-snug">
                          {entry.title}
                        </h3>

                        <p className="mt-1 text-sm text-[#827975]">
                          {entry.course.title}
                        </p>

                        <div className="mt-3 inline-flex rounded-lg bg-[#faf5f2] px-2.5 py-1 text-xs font-semibold text-[#76635b]">
                          {entry.course.code}
                        </div>

                        <div className="mt-5 space-y-3 border-t border-[#f0e9e5] pt-4">
                          <div className="flex items-center gap-3 text-sm">
                            <FiClock
                              className="shrink-0 text-[#8b292f]"
                              size={16}
                            />
                            <span>
                              {formatTime(entry.startTime)} –{" "}
                              {formatTime(entry.endTime)}
                            </span>
                          </div>

                          {entry.room && (
                            <div className="flex items-center gap-3 text-sm text-[#6f625c]">
                              <FiMapPin
                                className="shrink-0 text-[#8b292f]"
                                size={16}
                              />
                              <span>{entry.room}</span>
                            </div>
                          )}

                          {entry.instructor && (
                            <div className="flex items-center gap-3 text-sm text-[#6f625c]">
                              <FiUser
                                className="shrink-0 text-[#8b292f]"
                                size={16}
                              />
                              <span>{entry.instructor}</span>
                            </div>
                          )}
                        </div>

                        {entry.notes && (
                          <div className="mt-4 rounded-xl bg-[#faf8f6] p-3">
                            <p className="text-xs font-semibold text-[#827975]">
                              Notes
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-[#51423d]">
                              {entry.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
            </div>
          ) : null}
        </section>

        {/* Footer note */}
        <div className="flex items-start gap-3 rounded-xl border border-[#eee5df] bg-white/70 p-4 text-sm text-[#827975]">
          <FiAlertCircle className="mt-0.5 shrink-0 text-[#8b292f]" size={17} />
          <p className="leading-6">
            This timetable displays Monday through Friday. If a class is
            missing, check that its timetable entry has the correct
            weekday and is saved in the database.
          </p>
        </div>
      </div>
    </main>
  );
}
