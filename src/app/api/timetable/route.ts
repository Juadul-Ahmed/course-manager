import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const entries = await prisma.timetableEntry.findMany({
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
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Failed to fetch timetable:", error);

    return NextResponse.json(
      { error: "Failed to fetch timetable entries" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const title =
      typeof body.title === "string" ? body.title.trim() : "";
    const courseId =
      typeof body.courseId === "string" ? body.courseId : "";
    const startTime =
      typeof body.startTime === "string" ? body.startTime : "";
    const endTime =
      typeof body.endTime === "string" ? body.endTime : "";
    const dayOfWeek = Number(body.dayOfWeek);

    if (
      !title ||
      !courseId ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(startTime) ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(endTime) ||
      !Number.isInteger(dayOfWeek) ||
      dayOfWeek < 1 ||
      dayOfWeek > 5 ||
      startTime >= endTime
    ) {
      return NextResponse.json(
        { error: "Please provide valid timetable details." },
        { status: 400 },
      );
    }

    const entry = await prisma.timetableEntry.create({
      data: {
        title,
        dayOfWeek,
        startTime,
        endTime,
        courseId,
        room:
          typeof body.room === "string" && body.room.trim()
            ? body.room.trim()
            : null,
        instructor:
          typeof body.instructor === "string" && body.instructor.trim()
            ? body.instructor.trim()
            : null,
        notes:
          typeof body.notes === "string" && body.notes.trim()
            ? body.notes.trim()
            : null,
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
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Failed to create timetable entry:", error);

    return NextResponse.json(
      {
        error:
          "Failed to create timetable entry. Check that the selected course exists.",
      },
      { status: 500 },
    );
  }
}