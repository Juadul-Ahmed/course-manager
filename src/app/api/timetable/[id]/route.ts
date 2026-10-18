
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: {
      title?: string;
      dayOfWeek?: number;
      startTime?: string;
      endTime?: string;
      room?: string | null;
      instructor?: string | null;
      notes?: string | null;
      courseId?: string;
    } = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return NextResponse.json(
          { error: "Title is required." },
          { status: 400 },
        );
      }
      data.title = body.title.trim();
    }

    if (body.dayOfWeek !== undefined) {
      const day = Number(body.dayOfWeek);
      if (!Number.isInteger(day) || day < 0 || day > 6) {
        return NextResponse.json(
          { error: "Invalid day of week." },
          { status: 400 },
        );
      }
      data.dayOfWeek = day;
    }

    for (const field of ["startTime", "endTime"] as const) {
      if (body[field] !== undefined) {
        if (
          typeof body[field] !== "string" ||
          !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(body[field])
        ) {
          return NextResponse.json(
            { error: `Invalid ${field}. Use HH:mm format.` },
            { status: 400 },
          );
        }
        data[field] = body[field];
      }
    }

    if (
      (data.startTime !== undefined || data.endTime !== undefined)
    ) {
      const current = await prisma.timetableEntry.findUnique({
        where: { id },
        select: { startTime: true, endTime: true },
      });

      if (!current) {
        return NextResponse.json(
          { error: "Timetable entry not found." },
          { status: 404 },
        );
      }

      const startTime = data.startTime ?? current.startTime;
      const endTime = data.endTime ?? current.endTime;

      if (startTime >= endTime) {
        return NextResponse.json(
          { error: "End time must be after start time." },
          { status: 400 },
        );
      }
    }

    if (body.courseId !== undefined) {
      if (typeof body.courseId !== "string" || !body.courseId) {
        return NextResponse.json(
          { error: "A course is required." },
          { status: 400 },
        );
      }
      data.courseId = body.courseId;
    }

    for (const field of ["room", "instructor", "notes"] as const) {
      if (body[field] !== undefined) {
        if (body[field] !== null && typeof body[field] !== "string") {
          return NextResponse.json(
            { error: `Invalid ${field}.` },
            { status: 400 },
          );
        }
        const value =
          typeof body[field] === "string" ? body[field].trim() : "";
        data[field] = value || null;
      }
    }

    const entry = await prisma.timetableEntry.update({
      where: { id },
      data,
      include: {
        course: {
          select: { id: true, title: true, code: true },
        },
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Failed to update timetable entry:", error);

    return NextResponse.json(
      { error: "Failed to update timetable entry." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;

    await prisma.timetableEntry.delete({ where: { id } });

    return NextResponse.json({ message: "Timetable entry deleted." });
  } catch (error) {
    console.error("Failed to delete timetable entry:", error);

    return NextResponse.json(
      { error: "Failed to delete timetable entry." },
      { status: 500 },
    );
  }
}
