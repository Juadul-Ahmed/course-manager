
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Course = {
  id: string;
  title: string;
  code: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
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

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const ACCEPTED_FILES =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp";

function formatFileSize(bytes: number | null) {
  if (bytes == null) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "Unknown date";

  return parsedDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getFileType(material: Pick<Material, "name">) {
  const name = material.name.toLowerCase();

  if (name.endsWith(".pdf")) return "PDF";
  if (/\.(doc|docx)$/.test(name)) return "Word";
  if (/\.(ppt|pptx)$/.test(name)) return "PowerPoint";
  if (/\.(xls|xlsx)$/.test(name)) return "Excel";
  if (/\.(jpg|jpeg|png|webp)$/.test(name)) return "Image";
  if (name.endsWith(".txt")) return "Text";

  return "File";
}

function FileIcon({ type }: { type: string }) {
  const styles: Record<string, string> = {
    PDF: "bg-red-50 text-red-700 ring-red-100",
    Word: "bg-blue-50 text-blue-700 ring-blue-100",
    PowerPoint: "bg-orange-50 text-orange-700 ring-orange-100",
    Excel: "bg-green-50 text-green-700 ring-green-100",
    Image: "bg-purple-50 text-purple-700 ring-purple-100",
    Text: "bg-gray-100 text-gray-700 ring-gray-200",
    File: "bg-gray-100 text-gray-700 ring-gray-200",
  };

  const labels: Record<string, string> = {
    PDF: "PDF",
    Word: "DOC",
    PowerPoint: "PPT",
    Excel: "XLS",
    Image: "IMG",
    Text: "TXT",
    File: "FILE",
  };

  return (
    <div
      aria-label={`${type} file`}
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[10px] font-extrabold ring-1 ${styles[type] || styles.File}`}
    >
      {labels[type] || "FILE"}
    </div>
  );
}

function CoursePicker({
  courses,
  value,
  onChange,
  disabled,
}: {
  courses: Course[];
  value: string;
  onChange: (courseId: string) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCourse = courses.find((course) => course.id === value);

  const filteredCourses = courses.filter((course) => {
    const searchTerm = query.trim().toLowerCase();

    return (
      !searchTerm ||
      course.title.toLowerCase().includes(searchTerm) ||
      course.code.toLowerCase().includes(searchTerm)
    );
  });

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        Course <span className="text-red-600">*</span>
      </label>

      <button
        type="button"
        disabled={disabled || courses.length === 0}
        onClick={() => {
          setOpen((current) => !current);
          setQuery("");
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex min-h-[68px] w-full items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-left transition hover:border-red-300 hover:bg-red-50/30 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-50"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-lg text-red-700">
            ▦
          </span>

          <span className="min-w-0">
            <span
              className={`block truncate text-sm font-semibold ${
                selectedCourse ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {selectedCourse
                ? selectedCourse.title
                : courses.length === 0
                  ? "No courses available"
                  : "Choose a course"}
            </span>

            {selectedCourse && (
              <span className="mt-1 block text-xs text-gray-500">
                {selectedCourse.code}
              </span>
            )}
          </span>
        </span>

        <span className="shrink-0 text-gray-400" aria-hidden="true">
          {open ? "⌃" : "⌄"}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-200/70">
          <div className="border-b border-gray-100 p-3">
            <input
              type="search"
              autoComplete="off"
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by course name or code..."
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div className="max-h-64 overflow-y-auto p-2" role="listbox">
            {filteredCourses.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-gray-500">
                No matching courses found.
              </p>
            ) : (
              filteredCourses.map((course) => {
                const isSelected = course.id === value;

                return (
                  <button
                    key={course.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(course.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition ${
                      isSelected
                        ? "bg-red-50 text-red-800"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-semibold">
                        {course.title}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        {course.code}
                      </span>
                    </span>

                    {isSelected && (
                      <span className="shrink-0 font-bold text-red-700">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-500">
              {courses.length}{" "}
              {courses.length === 1 ? "course" : "courses"} available
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MaterialsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);

    setError("");

    try {
      const coursesResponse = await fetch("/api/courses", {
        method: "GET",
        cache: "no-store",
      });

      const coursesData: unknown = await coursesResponse
        .json()
        .catch(() => null);

      if (!coursesResponse.ok) {
        throw new Error(
          `Failed to load courses (${coursesResponse.status}): ${
            typeof coursesData === "object" &&
            coursesData !== null &&
            "error" in coursesData
              ? String(coursesData.error)
              : "Please check your administrator session."
          }`,
        );
      }

      const rawCourses: unknown = Array.isArray(coursesData)
        ? coursesData
        : typeof coursesData === "object" &&
            coursesData !== null &&
            "courses" in coursesData
          ? coursesData.courses
          : [];

      if (!Array.isArray(rawCourses)) {
        throw new Error("The courses API did not return a course list.");
      }

      const courseList = rawCourses.filter(
        (item): item is Course =>
          typeof item === "object" &&
          item !== null &&
          "id" in item &&
          typeof item.id === "string" &&
          "title" in item &&
          typeof item.title === "string" &&
          "code" in item &&
          typeof item.code === "string",
      );

      setCourses(courseList);

      const materialsResponse = await fetch("/api/materials", {
        method: "GET",
        cache: "no-store",
      });

      const materialsData: unknown = await materialsResponse
        .json()
        .catch(() => null);

      if (!materialsResponse.ok) {
        throw new Error(
          `Failed to load materials (${materialsResponse.status}): ${
            typeof materialsData === "object" &&
            materialsData !== null &&
            "error" in materialsData
              ? String(materialsData.error)
              : "Please try refreshing."
          }`,
        );
      }

      const rawMaterials: unknown = Array.isArray(materialsData)
        ? materialsData
        : typeof materialsData === "object" &&
            materialsData !== null &&
            "materials" in materialsData
          ? materialsData.materials
          : [];

      if (!Array.isArray(rawMaterials)) {
        throw new Error("The materials API did not return a material list.");
      }

      setMaterials(rawMaterials as Material[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load page data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) void loadData();
    });

    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const filteredMaterials = useMemo(() => {
    const query = search.trim().toLowerCase();

    return materials.filter((material) => {
      const matchesSearch =
        !query ||
        material.name.toLowerCase().includes(query) ||
        (material.course?.title || "").toLowerCase().includes(query) ||
        (material.course?.code || "").toLowerCase().includes(query);

      const matchesCourse =
        !filterCourse || material.courseId === filterCourse;

      return matchesSearch && matchesCourse;
    });
  }, [materials, search, filterCourse]);

  const totalSize = materials.reduce(
    (total, material) => total + (material.size || 0),
    0,
  );

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedCourse) {
      setError("Please choose a course before uploading.");
      return;
    }

    if (!selectedFile) {
      setError("Please choose a file to upload.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("The maximum file size is 50 MB.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("courseId", selectedCourse);

      const response = await fetch("/api/materials", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      setSelectedFile(null);

      if (fileInputRef.current) fileInputRef.current.value = "";

      setSuccess("Material uploaded successfully.");
      await loadData(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(material: Material) {
    setError("");
    setDownloadingId(material.id);

    try {
      const response = await fetch(`/api/materials/${material.id}`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Could not prepare the download.");
      }

      if (!data.url) {
        throw new Error("The server did not return a download URL.");
      }

      const link = document.createElement("a");
      link.href = data.url;
      link.download = data.name || material.name;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete(material: Material) {
    const confirmed = window.confirm(
      `Delete "${material.name}" permanently? This cannot be undone.`,
    );

    if (!confirmed || deletingId) return;

    setError("");
    setSuccess("");
    setDeletingId(material.id);

    try {
      const response = await fetch(`/api/materials/${material.id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete material.");
      }

      setMaterials((current) =>
        current.filter((item) => item.id !== material.id),
      );

      setSuccess("Material deleted successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-6 text-gray-900 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Page heading */}
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-red-700">
              <span className="h-2 w-2 rounded-full bg-red-600" />
              Learning resources
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Course Materials
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
              Organize course resources, share learning materials, and manage
              your files from one place.
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
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span aria-hidden="true">↻</span>
              {loading ? "Refreshing..." : "Refresh data"}
            </button>
          </div>
        </header>

        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-800"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 font-bold"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-start justify-between gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm leading-6 text-green-800"
          >
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="shrink-0 font-bold"
              aria-label="Dismiss success message"
            >
              ×
            </button>
          </div>
        )}

        {/* Summary cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="group rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-red-100 hover:shadow-lg hover:shadow-red-900/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total materials
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
                  {loading ? "—" : materials.length}
                </p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-xl text-red-700 transition group-hover:bg-red-100">
                ▤
              </span>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Resources in your library
            </p>
          </div>

          <div className="group rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-red-100 hover:shadow-lg hover:shadow-red-900/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Available courses
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
                  {loading ? "—" : courses.length}
                </p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-xl text-orange-700 transition group-hover:bg-orange-100">
                ▦
              </span>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Courses ready for resources
            </p>
          </div>

          <div className="group rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-red-100 hover:shadow-lg hover:shadow-red-900/5 sm:col-span-2 xl:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total file size
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
                  {loading ? "—" : formatFileSize(totalSize)}
                </p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-700 transition group-hover:bg-emerald-100">
                ↗
              </span>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Combined size of uploaded files
            </p>
          </div>
        </section>

        {/* Upload panel */}
        <section className="overflow-visible rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <div className="flex items-center gap-4 border-b border-gray-100 px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-xl text-white shadow-sm shadow-red-200">
              ↑
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-950 sm:text-xl">
                Upload new material
              </h2>
              <p className="mt-1 text-sm leading-5 text-gray-500">
                Select a course and upload a resource for your students.
              </p>
            </div>
          </div>

          <form onSubmit={handleUpload} className="space-y-6 p-5 sm:p-7">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                {loading ? (
                  <>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Course
                    </label>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                      Loading courses...
                    </div>
                  </>
                ) : (
                  <CoursePicker
                    courses={courses}
                    value={selectedCourse}
                    onChange={setSelectedCourse}
                    disabled={uploading}
                  />
                )}

                {!loading && courses.length === 0 && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
                    No courses were loaded. Try refreshing the page. If the
                    problem continues, check the course API and your admin
                    session.
                  </div>
                )}

                {selectedCourse && (
                  <p className="mt-2 text-xs text-gray-400">
                    Your resource will be linked to this course.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="material-file"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Choose file <span className="text-red-600">*</span>
                </label>

                <label
                  htmlFor="material-file"
                  className="flex min-h-[130px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/70 px-4 py-5 text-center transition hover:border-red-300 hover:bg-red-50/40"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl text-red-600 shadow-sm ring-1 ring-gray-200">
                    ↑
                  </span>
                  <span className="mt-3 text-sm font-semibold text-gray-800">
                    Click to browse your files
                  </span>
                  <span className="mt-1 text-xs text-gray-400">
                    PDF, Office documents, TXT and images
                  </span>
                </label>

                <input
                  ref={fileInputRef}
                  id="material-file"
                  type="file"
                  accept={ACCEPTED_FILES}
                  required
                  disabled={uploading}
                  onChange={(event) =>
                    setSelectedFile(event.target.files?.[0] || null)
                  }
                  className="sr-only"
                />

                <p className="mt-2 text-xs leading-5 text-gray-400">
                  Maximum file size: 50 MB.
                </p>
              </div>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50/60 p-4">
                <FileIcon type={getFileType(selectedFile)} />
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold text-gray-900">
                    {selectedFile.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 transition hover:bg-white hover:text-red-700 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="flex flex-col gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-xs leading-5 text-gray-400">
                <span aria-hidden="true">🔒</span>
                Files are stored in your Supabase bucket.
              </p>

              <button
                type="submit"
                disabled={
                  uploading ||
                  loading ||
                  courses.length === 0 ||
                  !selectedCourse ||
                  !selectedFile
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#B91C1C] focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {uploading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Uploading file...
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">↑</span>
                    Upload material
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Materials library */}
        <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5 sm:p-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-950 sm:text-xl">
                    Uploaded materials
                  </h2>
                  {!loading && (
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                      {filteredMaterials.length}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Find, download, and manage your learning resources.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:w-[540px]">
                <div>
                  <label
                    htmlFor="search-materials"
                    className="mb-1.5 block text-xs font-semibold text-gray-500"
                  >
                    Search library
                  </label>
                  <input
                    id="search-materials"
                    type="search"
                    placeholder="Search files or courses..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="filter-course"
                    className="mb-1.5 block text-xs font-semibold text-gray-500"
                  >
                    Filter by course
                  </label>
                  <select
                    id="filter-course"
                    value={filterCourse}
                    onChange={(event) => setFilterCourse(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
                  >
                    <option value="">All courses</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code} — {course.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center px-6 py-16">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-red-100 border-t-red-600" />
              <p className="mt-4 text-sm text-gray-500">
                Loading your materials...
              </p>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl text-red-700">
                ▤
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">
                No materials found
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                {materials.length === 0
                  ? "Your library is empty. Upload your first resource using the form above."
                  : "Try another search term or select a different course filter."}
              </p>

              {(search || filterCourse) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilterCourse("");
                  }}
                  className="mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_100px_130px] gap-4 border-b border-gray-100 bg-gray-50/80 px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 md:grid">
                <span>Material</span>
                <span>Course</span>
                <span>File size</span>
                <span className="text-right">Actions</span>
              </div>

              <div className="divide-y divide-gray-100">
                {filteredMaterials.map((material) => {
                  const type = getFileType(material);

                  return (
                    <article
                      key={material.id}
                      className="grid gap-4 px-5 py-5 transition-colors hover:bg-gray-50/80 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_100px_130px] md:items-center md:px-6"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <FileIcon type={type} />
                        <div className="min-w-0">
                          <p
                            title={material.name}
                            className="break-words text-sm font-semibold text-gray-900"
                          >
                            {material.name}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {type} <span aria-hidden="true">·</span>{" "}
                            {formatDate(material.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="min-w-0 rounded-xl bg-gray-50 px-3 py-2.5 md:bg-transparent md:p-0">
                        <p className="break-words text-sm font-medium text-gray-700">
                          {material.course?.title || "Course unavailable"}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {material.course?.code || "Unassigned"}
                        </p>
                      </div>

                      <div className="text-sm text-gray-500">
                        <span className="mr-2 text-xs text-gray-400 md:hidden">
                          Size:
                        </span>
                        {formatFileSize(material.size)}
                      </div>

                      <div className="flex items-center gap-2 md:justify-end">
                        <button
                          type="button"
                          onClick={() => void handleDownload(material)}
                          disabled={
                            downloadingId === material.id ||
                            deletingId === material.id
                          }
                          title="Download material"
                          aria-label={`Download ${material.name}`}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-base font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {downloadingId === material.id ? "…" : "↓"}
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDelete(material)}
                          disabled={deletingId !== null || downloadingId !== null}
                          title="Delete material"
                          aria-label={`Delete ${material.name}`}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-white text-lg font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === material.id ? "…" : "×"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {!loading && filteredMaterials.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50/70 px-5 py-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span>
                Showing {filteredMaterials.length} of {materials.length}{" "}
                materials
              </span>
              <span>{formatFileSize(totalSize)} total stored file size</span>
            </div>
          )}
        </section>

        <footer className="pb-2 text-center text-xs text-gray-400">
          Course Materials <span aria-hidden="true">·</span> Learning resources
          management
        </footer>
      </div>
    </main>
  );
}
