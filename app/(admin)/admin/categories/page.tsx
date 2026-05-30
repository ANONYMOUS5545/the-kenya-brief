import { prisma } from "@/lib/prisma";
import AdminCategoryManager from "@/components/admin/AdminCategoryManager";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { articles: true } } },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 font-sans">Categories</h1>
        <p className="text-gray-500 font-sans text-sm mt-1">Manage news categories and topics</p>
      </div>
      <AdminCategoryManager initialCategories={categories as any} />
    </div>
  );
}
