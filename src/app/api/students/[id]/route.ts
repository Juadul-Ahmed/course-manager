
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  return session;
}

// UPDATE STUDENT
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const studentId =
      typeof body.studentId === "string"
        ? body.studentId.trim().toLowerCase()
        : "";

    if (!name || name.length > 100) {
      return NextResponse.json(
        { error: "Name is required and must be 100 characters or fewer." },
        { status: 400 },
      );
    }

    if (!/^[a-z0-9._]{3,50}$/.test(studentId)) {
      return NextResponse.json(
        {
          error:
            "Student ID must contain 3–50 lowercase letters, numbers, dots, or underscores.",
        },
        { status: 400 },
      );
    }

    const existingStudent = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
      },
    });

    if (!existingStudent || existingStudent.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Student not found." },
        { status: 404 },
      );
    }

    const email = `${studentId}@students.course-manager.local`;

    const duplicate = await prisma.user.findFirst({
      where: {
        id: { not: id },
        OR: [{ username: studentId }, { email }],
      },
      select: { id: true },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "That Student ID is already in use." },
        { status: 409 },
      );
    }

    const updatedStudent = await prisma.user.update({
      where: { id },
      data: {
        name,
        username: studentId,
        displayUsername: studentId,
        email,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error("Update student error:", error);

    return NextResponse.json(
      { error: "Failed to update student." },
      { status: 500 },
    );
  }
}

// DELETE STUDENT
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 },
      );
    }

    const { id } = await params;

    if (session.user.id === id) {
      return NextResponse.json(
        { error: "You cannot delete your own account here." },
        { status: 400 },
      );
    }

    const student = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
      },
    });

    if (!student || student.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Student not found." },
        { status: 404 },
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Student deleted successfully.",
    });
  } catch (error) {
    console.error("Delete student error:", error);

    return NextResponse.json(
      { error: "Failed to delete student." },
      { status: 500 },
    );
  }
}
