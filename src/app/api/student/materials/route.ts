
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

    if (!session) {
      return NextResponse.json(
        { error: "Please sign in to view study materials." },
        { status: 401 },
      );
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Student access required." },
        { status: 403 },
      );
    }

    const materials = await prisma.uploadedFile.findMany({
      orderBy: {
        createdAt: "desc",
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

    return NextResponse.json(materials);
  } catch (error) {
    console.error("Fetch student materials error:", error);

    return NextResponse.json(
      { error: "Failed to load study materials." },
      { status: 500 },
    );
  }
}
