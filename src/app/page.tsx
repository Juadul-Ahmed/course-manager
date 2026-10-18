
import Link from "next/link";
import {
  BiBookOpen,
  BiSolidGraduation,
  BiCalendar,
  BiFile,
  BiRightArrowAlt,
} from "react-icons/bi";

const features = [
  {
    icon: BiBookOpen,
    number: "01",
    title: "Course Management",
    description:
      "Keep your courses, subjects, and academic information organized.",
  },
  {
    icon: BiCalendar,
    number: "02",
    title: "Weekly Timetable",
    description:
      "Plan your university week with a clear Monday-to-Friday schedule.",
  },
  {
    icon: BiFile,
    number: "03",
    title: "Learning Resources",
    description:
      "Keep course materials and assignments accessible in one place.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FAF9F6] text-[#242424]">
      {/* Navigation */}
      <header className="border-b border-black/[0.06]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B52D32] text-white">
              <BiSolidGraduation size={25} />
            </span>
            <span className="text-lg font-bold tracking-tight">
              Course Manager
            </span>
          </Link>

          <span className="hidden text-sm text-gray-500 sm:block">
            University Learning Portal
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#B52D32]/15 bg-white px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#B52D32]">
              <span className="h-2 w-2 rounded-full bg-[#B52D32]" />
              Your academic workspace
            </div>

            <h1 className="mt-7 max-w-2xl text-5xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              Make space for
              <span className="block text-[#B52D32]">better learning.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-gray-600 sm:text-lg">
              A simpler way to organize courses, follow your weekly
              timetable, manage assignments, and find your study materials.
            </p>

            <Link
              href="/login"
              className="group mt-9 inline-flex items-center gap-3 rounded-xl bg-[#B52D32] px-6 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#982329] hover:shadow-lg"
            >
              <span className="text-white text-xl" >Get started </span>
              <BiRightArrowAlt
                size={25}
                className="transition-transform group-hover:translate-x-1 text-white"
              />
            </Link>

            <p className="mt-4 text-xs text-gray-500">
              Sign in to access your learning workspace.
            </p>
          </div>

          {/* Decorative visual */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -right-5 -top-6 h-36 w-36 rounded-full bg-[#EAD9CE]/70 blur-3xl" />
            <div className="absolute -bottom-8 -left-5 h-40 w-40 rounded-full bg-[#B52D32]/10 blur-3xl" />

            <div className="relative rounded-[2rem] border border-black/[0.06] bg-white p-6 shadow-[0_24px_80px_-30px_rgba(65,45,35,0.22)] sm:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Your week
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    Stay on track.
                  </h2>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F8ECEA] text-[#B52D32]">
                  <BiCalendar size={25} />
                </span>
              </div>

              <div className="mt-8 grid grid-cols-5 gap-2">
                {["MON", "TUE", "WED", "THU", "FRI"].map((day, index) => (
                  <div
                    key={day}
                    className={`rounded-xl px-1 py-3 text-center ${
                      index === 2
                        ? "bg-[#B52D32] text-white"
                        : "bg-[#F7F6F3] text-gray-500"
                    }`}
                  >
                    <p className="text-[10px] font-semibold">{day}</p>
                    <p className="mt-2 text-lg font-semibold">
                      {12 + index}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-[#FAF9F6] p-4">
                  <span className="h-10 w-1 rounded-full bg-[#B52D32]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      Courses & classes
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Keep your academic week organized
                    </p>
                  </div>
                  <BiBookOpen size={22} className="text-gray-400" />
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-[#FAF9F6] p-4">
                  <span className="h-10 w-1 rounded-full bg-[#C5A46D]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      Study resources
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Keep important materials together
                    </p>
                  </div>
                  <BiFile size={22} className="text-gray-400" />
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-5">
                <p className="text-center text-xs text-gray-400">
                  One workspace. A clearer way to learn.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-black/[0.05] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B52D32]">
              Everything in one place
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Built around your studies.
            </h2>
            <p className="mt-4 leading-7 text-gray-500">
              Spend less time searching for information and more time
              focusing on what matters.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.number}
                  className="group rounded-2xl border border-gray-200/80 bg-[#FAF9F6] p-6 transition duration-200 hover:-translate-y-1 hover:border-[#B52D32]/25 hover:shadow-lg hover:shadow-black/[0.04] sm:p-7"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#B52D32] shadow-sm">
                      <Icon size={25} />
                    </span>
                    <span className="text-sm font-medium text-gray-300">
                      {feature.number}
                    </span>
                  </div>

                  <h3 className="mt-7 text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-gray-500">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#FAF9F6]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Link href="/" className="font-semibold text-gray-800">
            Course Manager
          </Link>
          <p>University Learning Portal</p>
        </div>
      </footer>
    </main>
  );
}
