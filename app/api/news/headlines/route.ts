import { NextResponse } from "next/server";
import { readNewsCache } from "@/lib/news-cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await readNewsCache();
  const headlines = items.slice(0, 8).map((item) => item.title);

  return NextResponse.json({ success: true, headlines });
}
