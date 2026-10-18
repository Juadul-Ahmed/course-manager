
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return null;
  }

  return session.user;
}

export async function GET() {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courses = await prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { assignments: true, files: true },
        },
      },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error("GET /api/courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { title, code, description } = body as {
      title?: unknown;
      code?: unknown;
      description?: unknown;
    };

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof code !== "string" ||
      !code.trim()
    ) {
      return NextResponse.json(
        { error: "Course title and course code are required" },
        { status: 400 },
      );
    }

    if (
      (description !== undefined &&
        description !== null &&
        typeof description !== "string") ||
      title.trim().length > 200 ||
      code.trim().length > 50 ||
      (typeof description === "string" && description.length > 2000)
    ) {
      return NextResponse.json(
        { error: "One or more fields are invalid or too long" },
        { status: 400 },
      );
    }

    const course = await prisma.course.create({
      data: {
        title: title.trim(),
        code: code.trim().toUpperCase(),
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A course with this code already exists" },
        { status: 409 },
      );
    }

    console.error("POST /api/courses:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 },
    );
  }
}
