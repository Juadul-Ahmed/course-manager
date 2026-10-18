
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user?.role === "ADMIN";
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.assignment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    const data: {
      title?: string;
      description?: string | null;
      courseId?: string;
      dueDate?: Date | null;
    } = {};

    if (body.title !== undefined) {
      if (
        typeof body.title !== "string" ||
        !body.title.trim()
      ) {
        return NextResponse.json(
          { error: "Title is required" },
          { status: 400 },
        );
      }

      data.title = body.title.trim();
    }

    if (body.description !== undefined) {
      if (
        body.description !== null &&
        typeof body.description !== "string"
      ) {
        return NextResponse.json(
          { error: "Invalid description" },
          { status: 400 },
        );
      }

      data.description =
        typeof body.description === "string"
          ? body.description.trim() || null
          : null;
    }

    if (body.courseId !== undefined) {
      if (
        typeof body.courseId !== "string" ||
        !body.courseId
      ) {
        return NextResponse.json(
          { error: "Course is required" },
          { status: 400 },
        );
      }

      const course = await prisma.course.findUnique({
        where: { id: body.courseId },
        select: { id: true },
      });

      if (!course) {
        return NextResponse.json(
          { error: "Course not found" },
          { status: 400 },
        );
      }

      data.courseId = body.courseId;
    }

    if (body.dueDate !== undefined) {
      if (body.dueDate === null || body.dueDate === "") {
        data.dueDate = null;
      } else {
        const date = new Date(body.dueDate);

        if (Number.isNaN(date.getTime())) {
          return NextResponse.json(
            { error: "Invalid deadline" },
            { status: 400 },
          );
        }

        data.dueDate = date;
      }
    }

    const assignment = await prisma.assignment.update({
      where: { id },
      data,
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

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Update assignment error:", error);

    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    const existing = await prisma.assignment.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    await prisma.assignment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete assignment error:", error);

    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 },
    );
  }
}
