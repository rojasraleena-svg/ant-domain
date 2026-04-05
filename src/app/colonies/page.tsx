import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const metadata = {
  title: "我的蚁群",
  description: "管理和记录你的蚁群成长",
};

export default async function ColoniesPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">我的蚁群</h1>
          <p className="mt-1 text-muted-foreground">
            管理和记录你的蚁群成长过程
          </p>
        </div>
        <Link
          href="/colonies/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          + 新建蚁群
        </Link>
      </div>

      {/* 蚁群列表 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p className="text-lg mb-2">还没有蚁群</p>
          <p className="text-sm">点击上方按钮创建你的第一个蚁群档案</p>
        </div>
      </div>
    </div>
  );
}
