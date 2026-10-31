
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToDrive, deleteFromDrive } from "@/lib/google-drive";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const BUCKET = "course-materials";
const MAX_FILE_SIZE = 100 * 1024 * 1024;

const blockedExtensions = new Set([
  "exe",
  "dll",
  "com",
  "bat",
  "cmd",
  "msi",
  "scr",
  "ps1",
  "sh",
  "vbs",
  "php",
  "phtml",
]);

function safeFileName(name: string): string {
  return (
    name
      .normalize("NFKD")
      .replace(/[^\w.-]+/g, "_")
      .replace(/^\.+/, "")
      .slice(-150) || "attachment"
  );
}

async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

// GET: List files attached to an assignment
export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    const attachments = await prisma.assignmentAttachment.findMany({
      where: { assignmentId: id },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        size: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error("List assignment attachments error:", error);

    return NextResponse.json(
      { error: "Failed to load attachments" },
      { status: 500 },
    );
  }
}

// POST: Upload a file (admins only)
export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  let uploadedStorageKey: string | null = null;

  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: administrators only" },
        { status: 403 },
      );
    }

    const { id } = await context.params;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const fileEntry = formData.get("file");

    if (!(fileEntry instanceof File) || fileEntry.size === 0) {
      return NextResponse.json(
        { error: "Choose a file to upload" },
        { status: 400 },
      );
    }

    if (fileEntry.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "The maximum file size is 100 MB" },
        { status: 400 },
      );
    }

    const originalName =
      fileEntry.name.split(/[\\/]/).pop() || "attachment";

    const extension = originalName.includes(".")
      ? originalName.split(".").pop()!.toLowerCase()
      : "";

    if (blockedExtensions.has(extension)) {
      return NextResponse.json(
        { error: "This file type is not allowed" },
        { status: 400 },
      );
    }

    const storageKey = await uploadToDrive(
      Buffer.from(await fileEntry.arrayBuffer()),
      originalName,
      fileEntry.type || "application/octet-stream",
    );

    uploadedStorageKey = storageKey;

    const attachment = await prisma.assignmentAttachment.create({
      data: {
        originalName,
        storageKey,
        mimeType: fileEntry.type || null,
        size: fileEntry.size,
        assignmentId: id,
        uploadedById: session.user.id,
      },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        size: true,
        createdAt: true,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error("Upload assignment attachment error:", error);

    if (uploadedStorageKey) {
      try {
        await deleteFromDrive(uploadedStorageKey);
      } catch (cleanupError) {
        console.error("Upload cleanup failed:", cleanupError);
      }
    }

    return NextResponse.json(
      { error: "Failed to upload attachment" },
      { status: 500 },
    );
  }
}
