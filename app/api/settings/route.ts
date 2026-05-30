import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findMany();
    const map = Object.fromEntries(settings.map((s: { key: string; value: string }) => [s.key, s.value]));
    return NextResponse.json({ success: true, data: map });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const upserts = Object.entries(body).map(([key, value]) =>
      prisma.siteSettings.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    );
    await Promise.all(upserts);
    return NextResponse.json({ success: true, message: "Settings saved" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to save settings" }, { status: 500 });
  }
}
