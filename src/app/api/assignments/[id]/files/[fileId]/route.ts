import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string; fileId: string }>;
};

const BUCKET = "course-materials";

async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

// GET — GENERATE A TEMPORARY DOWNLOAD LINK
// Available to signed-in students and admins.
export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Please sign in to download this file." },
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

    const { id, fileId } = await context.params;

    const attachment = await prisma.assignmentAttachment.findFirst({
      where: {
        id: fileId,
        assignmentId: id,
      },
      select: {
        id: true,
        originalName: true,
        storageKey: true,
      },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found." },
        { status: 404 },
      );
    }

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(attachment.storageKey, 60, {
        download: attachment.originalName,
      });

    if (error || !data?.signedUrl) {
      console.error(
        "Create attachment download URL error:",
        error?.message,
      );

      return NextResponse.json(
        { error: "Could not create the download link." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      url: data.signedUrl,
      name: attachment.originalName,
    });
  } catch (error) {
    console.error("Download assignment attachment error:", error);

    return NextResponse.json(
      { error: "Failed to prepare the download." },
      { status: 500 },
    );
  }
}

// DELETE — REMOVE AN ASSIGNMENT ATTACHMENT
// Admins only.
export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 },
      );
    }

    const { id, fileId } = await context.params;

    const attachment = await prisma.assignmentAttachment.findFirst({
      where: {
        id: fileId,
        assignmentId: id,
      },
      select: {
        id: true,
        storageKey: true,
      },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found." },
        { status: 404 },
      );
    }

    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([attachment.storageKey]);

    if (storageError) {
      console.error(
        "Remove assignment file error:",
        storageError.message,
      );

      return NextResponse.json(
        { error: "Could not remove the file from storage." },
        { status: 502 },
      );
    }

    await prisma.assignmentAttachment.delete({
      where: {
        id: attachment.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Attachment deleted successfully.",
    });
  } catch (error) {
    console.error("Delete assignment attachment error:", error);

    return NextResponse.json(
      { error: "Failed to delete the attachment." },
      { status: 500 },
    );
  }
}