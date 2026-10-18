
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiBookOpen,
  FiDownload,
  FiFile,
  FiFileText,
  FiImage,
  FiSearch,
  FiRefreshCw,
} from "react-icons/fi";

type Course = {
  id: string;
  title: string;
  code: string;
};

type Material = {
  id: string;
  name: string;
  mimeType: string | null;
  size: number | null;
  courseId: string | null;
  createdAt: string;
  course: Course | null;
};

type ApiError = {
  error?: string;
};

type DownloadResponse = {
  url?: string;
  name?: string;
  error?: string;
};

function getApiError(data: unknown, fallback: string): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return fallback;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function formatFileSize(size: number | null): string {
  if (size === null || !Number.isFinite(size) || size < 0) {
    return "Unknown size";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(date: string): string {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function getFileType(mimeType: string | null, name: string): string {
  const extension = name.split(".").pop()?.toLowerCase();

  if (mimeType === "application/pdf" || extension === "pdf") {
    return "PDF";
  }

  if (
    mimeType?.includes("word") ||
    ["doc", "docx"].includes(extension ?? "")
  ) {
    return "Word document";
  }

  if (
    mimeType?.includes("presentation") ||
    ["ppt", "pptx"].includes(extension ?? "")
  ) {
    return "Presentation";
  }

  if (
    mimeType?.includes("spreadsheet") ||
    ["xls", "xlsx", "csv"].includes(extension ?? "")
  ) {
    return "Spreadsheet";
  }

  if (mimeType?.startsWith("image/")) {
    return "Image";
  }

  if (mimeType?.startsWith("text/") || extension === "txt") {
    return "Text file";
  }

  return extension ? extension.toUpperCase() : "File";
}

function FileIcon({
  mimeType,
  name,
}: {
  mimeType: string | null;
  name: string;
}) {
  if (mimeType?.startsWith("image/")) {
    return <FiImage className="h-6 w-6" />;
  }

  if (
    mimeType === "application/pdf" ||
    name.toLowerCase().endsWith(".pdf")
  ) {
    return <FiFileText className="h-6 w-6" />;
  }

  return <FiFile className="h-6 w-6" />;
}

export default function StudentMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState("");

  // Load materials and courses together.
  const fetchData = useCallback(async () => {
    try {
      const [materialsResponse, coursesResponse] = await Promise.all([
        fetch("/api/student/materials", {
          cache: "no-store",
        }),
        fetch("/api/student/courses", {
          cache: "no-store",
        }),
      ]);

      const [materialsData, coursesData] = await Promise.all([
        readJson(materialsResponse),
        readJson(coursesResponse),
      ]);

      if (!materialsResponse.ok) {
        throw new Error(
          getApiError(materialsData, "Could not load study materials."),
        );
      }

      if (!coursesResponse.ok) {
        throw new Error(
          getApiError(coursesData, "Could not load courses."),
        );
      }

      if (!Array.isArray(materialsData)) {
        throw new Error("The server returned an invalid materials list.");
      }

      if (!Array.isArray(coursesData)) {
        throw new Error("The server returned an invalid courses list.");
      }

      setMaterials(materialsData as Material[]);
      setCourses(coursesData as Course[]);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading study materials.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Schedule the first request after the effect runs.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void fetchData();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [fetchData]);

  // Refresh both the materials and the course list.
  const loadMaterials = useCallback(() => {
    setLoading(true);
    setError("");
    setDownloadError("");
    void fetchData();
  }, [fetchData]);

  const filteredMaterials = useMemo(() => {
    const query = search.trim().toLowerCase();

    return materials.filter((material) => {
      const matchesSearch =
        !query ||
        material.name.toLowerCase().includes(query) ||
        (material.course?.title ?? "").toLowerCase().includes(query) ||
        (material.course?.code ?? "").toLowerCase().includes(query);

      const matchesCourse =
        selectedCourse === "all" ||
        material.courseId === selectedCourse;

      return matchesSearch && matchesCourse;
    });
  }, [materials, search, selectedCourse]);

  async function handleDownload(material: Material) {
    setDownloadingId(material.id);
    setDownloadError("");

    try {
      const response = await fetch(
        `/api/materials/${encodeURIComponent(material.id)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const result: unknown = await readJson(response);

      if (!response.ok) {
        throw new Error(
          getApiError(result, "Could not download this file."),
        );
      }

      if (
        typeof result !== "object" ||
        result === null ||
        !("url" in result) ||
        typeof result.url !== "string" ||
        !result.url
      ) {
        throw new Error("The server did not return a valid download link.");
      }

      // The API's signed URL should include Content-Disposition: attachment.
      // Navigating directly to it allows the browser to download the file.
      window.location.assign(result.url);
    } catch (err) {
      setDownloadError(
        err instanceof Error
          ? err.message
          : "Failed to prepare the download.",
      );
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#faf8f6] px-4 py-8 text-[#292322] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Page heading */}
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#853b43]">
              <FiBookOpen className="h-4 w-4" />
              Learning resources
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Study Materials
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#79716f] sm:text-base">
              Find your course documents, lecture notes, presentations,
              and other learning resources in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={loadMaterials}
            disabled={loading}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-[#e8dfdc] bg-white px-4 py-3 text-sm font-semibold transition hover:border-[#853b43] hover:text-[#853b43] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </section>

        {/* Summary cards */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#eee5e1] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#79716f]">
                  Available materials
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {loading ? "—" : materials.length}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f7e9e9] text-[#853b43]">
                <FiFileText className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#eee5e1] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#79716f]">
                  Available courses
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {loading ? "—" : courses.length}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3eee5] text-[#8c6b36]">
                <FiBookOpen className="h-6 w-6" />
              </div>
            </div>
          </div>
        </section>

        {/* Search and course filter */}
        <section className="rounded-2xl border border-[#eee5e1] bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_260px]">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9b918e]" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by file name or course..."
                className="w-full rounded-xl border border-[#e8dfdc] bg-[#fdfcfa] py-3 pl-12 pr-4 text-sm outline-none transition placeholder:text-[#a49b98] focus:border-[#853b43] focus:ring-2 focus:ring-[#853b43]/10"
              />
            </div>

            <select
              value={selectedCourse}
              onChange={(event) => setSelectedCourse(event.target.value)}
              className="w-full rounded-xl border border-[#e8dfdc] bg-[#fdfcfa] px-4 py-3 text-sm outline-none transition focus:border-[#853b43] focus:ring-2 focus:ring-[#853b43]/10"
            >
              <option value="all">All courses</option>

              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} — {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 text-sm text-[#79716f]">
            {loading
              ? "Loading materials..."
              : `Showing ${filteredMaterials.length} of ${materials.length} materials`}
          </div>
        </section>

        {/* Download error */}
        {downloadError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {downloadError}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-[#eee5e1] bg-white p-5"
              >
                <div className="h-12 w-12 rounded-xl bg-[#f0e9e6]" />
                <div className="mt-5 h-4 w-3/4 rounded bg-[#f0e9e6]" />
                <div className="mt-3 h-3 w-1/2 rounded bg-[#f0e9e6]" />
                <div className="mt-6 h-10 rounded-xl bg-[#f0e9e6]" />
              </div>
            ))}
          </div>
        )}

        {/* API error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
            <p className="font-semibold text-red-700">{error}</p>

            <button
              type="button"
              onClick={loadMaterials}
              className="mt-4 rounded-xl bg-[#853b43] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6e2e35]"
            >
              Try again
            </button>
          </div>
        )}

        {/* Materials */}
        {!loading && !error && filteredMaterials.length > 0 && (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredMaterials.map((material) => (
              <article
                key={material.id}
                className="group flex flex-col rounded-2xl border border-[#eee5e1] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#d9bfc0] hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f7e9e9] text-[#853b43] transition group-hover:bg-[#853b43] group-hover:text-white">
                    <FileIcon
                      mimeType={material.mimeType}
                      name={material.name}
                    />
                  </div>

                  <span className="rounded-lg bg-[#f6f2ef] px-2.5 py-1 text-xs font-semibold text-[#766b67]">
                    {getFileType(material.mimeType, material.name)}
                  </span>
                </div>

                <h2
                  className="mt-5 break-words text-base font-semibold leading-6"
                  title={material.name}
                >
                  {material.name}
                </h2>

                <div className="mt-3 min-h-[48px]">
                  {material.course ? (
                    <>
                      <p className="text-sm font-medium text-[#853b43]">
                        {material.course.code}
                      </p>

                      <p className="mt-1 line-clamp-2 text-sm text-[#79716f]">
                        {material.course.title}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-[#79716f]">
                      General study material
                    </p>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#f0e9e6] pt-4 text-xs text-[#8b817d]">
                  <span>{formatFileSize(material.size)}</span>
                  <span>{formatDate(material.createdAt)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => void handleDownload(material)}
                  disabled={downloadingId !== null}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#853b43] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#6e2e35] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiDownload className="h-4 w-4" />
                  {downloadingId === material.id
                    ? "Preparing download..."
                    : "Download material"}
                </button>
              </article>
            ))}
          </section>
        )}

        {/* Empty state */}
        {!loading && !error && filteredMaterials.length === 0 && (
          <section className="rounded-2xl border border-dashed border-[#dfd2cd] bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f7e9e9] text-[#853b43]">
              <FiBookOpen className="h-8 w-8" />
            </div>

            <h2 className="mt-5 text-lg font-semibold">
              {materials.length === 0
                ? "No study materials yet"
                : "No matching materials"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#79716f]">
              {materials.length === 0
                ? "Your uploaded course resources will appear here when your admin adds them."
                : "Try another search term or select a different course."}
            </p>

            {(search || selectedCourse !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCourse("all");
                }}
                className="mt-5 rounded-xl border border-[#e8dfdc] px-4 py-2.5 text-sm font-semibold transition hover:border-[#853b43] hover:text-[#853b43]"
              >
                Clear filters
              </button>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
