
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Student access required." },
        { status: 403 },
      );
    }

    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        code: true,
      },
      orderBy: {
        title: "asc",
      },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error("Fetch student courses error:", error);

    return NextResponse.json(
      { error: "Could not load courses." },
      { status: 500 },
    );
  }
}
