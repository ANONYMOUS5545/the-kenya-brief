import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ success: true, data: tags });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN","SENIOR_EDITOR","JUNIOR_EDITOR"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { name } = body;
    if (!name) return NextResponse.json({ success: false, error: "Name required" }, { status: 400 });
    const slug = slugify(name);
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    return NextResponse.json({ success: true, data: tag }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create tag" }, { status: 500 });
  }
}
