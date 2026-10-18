
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

export async function GET() {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("List students error:", error);

    return NextResponse.json(
      { error: "Failed to load students" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const studentId =
      typeof body.studentId === "string"
        ? body.studentId.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string" ? body.password : "";

    if (!name || !studentId || !password) {
      return NextResponse.json(
        { error: "Name, Student ID, and password are required" },
        { status: 400 },
      );
    }

    if (!/^[a-z0-9._]{3,50}$/.test(studentId)) {
      return NextResponse.json(
        {
          error:
            "Student ID must be 3–50 characters using letters, numbers, dots, or underscores",
        },
        { status: 400 },
      );
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { error: "Password must be 8–128 characters long" },
        { status: 400 },
      );
    }

    const email = `${studentId}@students.course-manager.local`;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: studentId }, { email }],
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This Student ID already exists" },
        { status: 409 },
      );
    }

    // Use Better Auth's configured password hasher.
    const context = await auth.$context;
    const hashedPassword = await context.password.hash(password);

    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          username: studentId,
          displayUsername: studentId,
          emailVerified: true,
          role: "STUDENT",
        },
      });

      await tx.account.create({
        data: {
          accountId: user.id,
          providerId: "credential",
          userId: user.id,
          password: hashedPassword,
        },
      });

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error("Create student error:", error);

    return NextResponse.json(
      { error: "Failed to create student. Check the server logs." },
      { status: 500 },
    );
  }
}
