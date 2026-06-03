export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import ArticleEditor from "@/components/admin/ArticleEditor";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";

interface Props { params: Promise<{ id: string }> }

export default async function EditorEditArticlePage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const isSenior = user?.role === "SENIOR_EDITOR";

  const [article, categories, tags] = await Promise.all([
    prisma.article.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!article) notFound();

  // Junior editors can only edit their own drafts
  if (!isSenior && article.authorId !== user.id) {
    redirect("/editor/articles");
  }

  return (
    <ArticleEditor
      categories={categories as any}
      tags={tags as any}
      article={article as any}
      userRole={user?.role || "JUNIOR_EDITOR"}
      redirectPath="/editor/articles"
    />
  );
}
