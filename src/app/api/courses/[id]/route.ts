
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return null;
  }

  return session.user;
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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
      title.trim().length > 200 ||
      code.trim().length > 50 ||
      (description !== undefined &&
        description !== null &&
        (typeof description !== "string" || description.length > 2000))
    ) {
      return NextResponse.json(
        { error: "One or more fields are invalid or too long" },
        { status: 400 },
      );
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        title: title.trim(),
        code: code.trim().toUpperCase(),
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
      },
    });

    return NextResponse.json(course);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "A course with this code already exists" },
          { status: 409 },
        );
      }

      if (error.code === "P2025") {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }
    }

    console.error("PUT /api/courses/[id]:", error);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }
    }

    console.error("DELETE /api/courses/[id]:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 },
    );
  }
}
