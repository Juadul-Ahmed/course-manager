
import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Please sign in to submit this assignment." },
        { status: 401 },
      );
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can submit assignments." },
        { status: 403 },
      );
    }

    const { id: assignmentId } = await params;
    const studentId = session.user.id;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 },
      );
    }

    // Create the submission, or return the existing one
    // if this student has already submitted.
    const submission = await prisma.submission.upsert({
      where: {
        studentId_assignmentId: {
          studentId,
          assignmentId,
        },
      },
      update: {},
      create: {
        studentId,
        assignmentId,
        status: "SUBMITTED",
      },
      select: {
        id: true,
        status: true,
        grade: true,
        feedback: true,
        submittedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Assignment submitted successfully.",
        submission,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Submit student assignment error:", error);

    return NextResponse.json(
      { error: "Failed to submit assignment. Please try again." },
      { status: 500 },
    );
  }
}
