
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user?.role === "ADMIN";
}

// GET: Fetch all assignments
export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const assignments = await prisma.assignment.findMany({
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: [
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Fetch assignments error:", error);

    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 },
    );
  }
}

// POST: Create a new assignment
export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : null;

    const courseId =
      typeof body.courseId === "string"
        ? body.courseId
        : "";

    if (!title || !courseId) {
      return NextResponse.json(
        { error: "Title and course are required" },
        { status: 400 },
      );
    }

    let dueDate: Date | null = null;

    if (body.dueDate !== undefined && body.dueDate !== null && body.dueDate !== "") {
      if (typeof body.dueDate !== "string") {
        return NextResponse.json(
          { error: "Invalid deadline" },
          { status: 400 },
        );
      }

      dueDate = new Date(body.dueDate);

      if (Number.isNaN(dueDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid deadline" },
          { status: 400 },
        );
      }
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Selected course does not exist" },
        { status: 400 },
      );
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description: description || null,
        dueDate,
        courseId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Create assignment error:", error);

    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 },
    );
  }
}
