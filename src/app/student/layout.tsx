import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import StudentSidebar from "@/components/student/StudentSidebar";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "ADMIN") {
    redirect("/dashboard");
  }

  if (session.user.role !== "STUDENT") {
    redirect("/login");
  }

  const studentName = session.user.name || "Student";
  const studentEmail = session.user.email || "";

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-zinc-900">
      <StudentSidebar
        studentName={studentName}
        studentEmail={studentEmail}
      />

      <div className="min-h-screen lg:pl-[270px]">
        <main className="min-h-screen px-4 pb-8 pt-20 sm:px-6 lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}