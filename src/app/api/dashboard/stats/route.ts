
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const [
      totalCourses,
      totalStudents,
      totalAssignments,
      totalMaterials,
    ] = await Promise.all([
      prisma.course.count(),
      prisma.user.count({
        where: { role: "STUDENT" },
      }),
      prisma.assignment.count(),
      prisma.uploadedFile.count(),
    ]);

    return NextResponse.json({
      totalCourses,
      totalStudents,
      totalAssignments,
      totalMaterials,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);

    return NextResponse.json(
      { error: "Failed to load dashboard statistics." },
      { status: 500 },
    );
  }
}
