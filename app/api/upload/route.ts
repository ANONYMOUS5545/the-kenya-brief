import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN","SENIOR_EDITOR","JUNIOR_EDITOR"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: "File size exceeds 10MB" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: "Invalid file type" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name);
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const url = `/uploads/${filename}`;
    return NextResponse.json({ success: true, data: { url, filename, size: file.size, type: file.type } });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
