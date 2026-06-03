export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import ArticleEditor from "@/components/admin/ArticleEditor";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function EditorNewArticlePage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <ArticleEditor
      categories={categories as any}
      tags={tags as any}
      userRole={user?.role || "JUNIOR_EDITOR"}
      redirectPath="/editor/articles"
    />
  );
}
