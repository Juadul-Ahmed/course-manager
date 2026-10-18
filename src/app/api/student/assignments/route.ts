
import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Please sign in to view assignments." },
        { status: 401 },
      );
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Student access only." },
        { status: 403 },
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
        attachments: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            size: true,
          },
        },
        submissions: {
          where: {
            studentId: session.user.id,
          },
          select: {
            id: true,
            status: true,
            grade: true,
            feedback: true,
            submittedAt: true,
          },
          take: 1,
        },
      },
      orderBy: [
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(
      assignments.map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        course: assignment.course,
        attachments: assignment.attachments,
        submission: assignment.submissions[0] ?? null,
      })),
    );
  } catch (error) {
    console.error("Fetch student assignments error:", error);

    return NextResponse.json(
      { error: "Failed to fetch assignments." },
      { status: 500 },
    );
  }
}
