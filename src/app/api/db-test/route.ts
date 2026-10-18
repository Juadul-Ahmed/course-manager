
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await prisma.$queryRaw<
      { current_time: Date }[]
    >`SELECT NOW() AS current_time`;

    return NextResponse.json({
      success: true,
      message: "Neon database connection successful!",
      databaseTime: result[0]?.current_time,
    });
  } catch (error) {
    console.error("Database test failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
      },
      { status: 500 }
    );
  }
}
