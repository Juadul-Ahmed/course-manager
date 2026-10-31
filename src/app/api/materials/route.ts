
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToDrive, deleteFromDrive, driveDownloadUrl } from "@/lib/google-drive";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  return session;
}

// GET — LIST ALL MATERIALS (ADMIN ONLY)
export async function GET() {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Admin access required." },
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
    console.error("List materials error:", error);

    return NextResponse.json(
      { error: "Failed to load course materials." },
      { status: 500 },
    );
  }
}

// POST — UPLOAD MATERIAL (ADMIN ONLY)
export async function POST(request: Request) {
  let uploadedStorageKey: string | null = null;

  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 },
      );
    }

    const formData = await request.formData();

    const file = formData.get("file");
    const courseId = formData.get("courseId");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select a file to upload." },
        { status: 400 },
      );
    }

    if (typeof courseId !== "string" || !courseId.trim()) {
      return NextResponse.json(
        { error: "Please select a course." },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "The selected file is empty." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "The maximum file size is 50 MB." },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Upload PDF, Office documents, text files, or JPEG, PNG, and WebP images.",
        },
        { status: 400 },
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId.trim() },
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json(
        { error: "The selected course does not exist." },
        { status: 404 },
      );
    }

    const safeName = file.name
      .replace(/[/\\]/g, "_")
      .replace(/[^\w.\- ()]/g, "_")
      .slice(-150);

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const storageKey = await uploadToDrive(fileBuffer, safeName, file.type);
    uploadedStorageKey = storageKey;

    const savedFile = await prisma.uploadedFile.create({
      data: {
        name: file.name.slice(0, 255),
        url: driveDownloadUrl(storageKey),
        storageKey,
        mimeType: file.type,
        size: file.size,
        courseId: course.id,
        uploadedById: session.user.id,
      },
      select: {
        id: true,
        name: true,
        mimeType: true,
        size: true,
        courseId: true,
        createdAt: true,
      },
    });

    return NextResponse.json(savedFile, { status: 201 });
  } catch (error) {
    console.error("Material upload error:", error);

    if (uploadedStorageKey) {
      try {
        await deleteFromDrive(uploadedStorageKey);
      } catch (cleanupError) {
        console.error("Failed to clean up uploaded file:", cleanupError);
      }
    }

    return NextResponse.json(
      { error: "Something went wrong while uploading the material." },
      { status: 500 },
    );
  }
}
