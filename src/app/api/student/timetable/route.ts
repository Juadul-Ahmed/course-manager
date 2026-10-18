
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    // 1. Verify the current user's session.
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // 2. Reject users who are not signed in.
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    // 3. Only students can access this endpoint.
    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Forbidden. Student access required." },
        { status: 403 },
      );
    }

    // 4. Fetch timetable entries for Monday through Friday.
    const timetable = await prisma.timetableEntry.findMany({
      where: {
        dayOfWeek: {
          gte: 1,
          lte: 5,
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
      },
      orderBy: [
        { dayOfWeek: "asc" },
        { startTime: "asc" },
      ],
    });

    return NextResponse.json(timetable, { status: 200 });
  } catch (error) {
    console.error("GET /api/student/timetable failed:", error);

    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 },
    );
  }
}
