
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromDrive, driveDownloadUrl } from "@/lib/google-drive";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

async function requireAdmin() {
  const session = await getSession();

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  return session;
}

// DELETE — REMOVE MATERIAL (ADMIN ONLY)
export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 },
      );
    }

    const { id } = await params;

    const material = await prisma.uploadedFile.findUnique({
      where: { id },
      select: {
        id: true,
        url: true,
        storageKey: true,
      },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Material not found." },
        { status: 404 },
      );
    }

    const storageKey = material.storageKey || material.url;

    try {
      await deleteFromDrive(storageKey);
    } catch (storageError) {
      console.error("Google Drive delete error:", storageError);
      return NextResponse.json(
        { error: "Could not delete the stored file. Please try again." },
        { status: 502 },
      );
    }

    await prisma.uploadedFile.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Material deleted successfully.",
    });
  } catch (error) {
    console.error("Delete material error:", error);

    return NextResponse.json(
      { error: "Failed to delete material." },
      { status: 500 },
    );
  }
}

// GET — GENERATE A TEMPORARY DOWNLOAD LINK
export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Please sign in to download materials." },
        { status: 401 },
      );
    }

    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "STUDENT"
    ) {
      return NextResponse.json(
        { error: "You do not have permission to download this file." },
        { status: 403 },
      );
    }

    const { id } = await params;

    const material = await prisma.uploadedFile.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        url: true,
        storageKey: true,
      },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Material not found." },
        { status: 404 },
      );
    }

    const storageKey = material.storageKey || material.url;

    if (!storageKey) {
      return NextResponse.json(
        { error: "The storage path for this file is missing." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      url: driveDownloadUrl(storageKey),
      name: material.name,
    });
  } catch (error) {
    console.error("Download material error:", error);

    return NextResponse.json(
      { error: "Failed to prepare the download." },
      { status: 500 },
    );
  }
}
