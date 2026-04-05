import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "我的蚁群",
  description: "管理和记录你的蚁群成长",
};

export default async function ColoniesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // TODO: 加载用户的蚁群列表
  // const { data: colonies } = await supabase
  //   .from("colonies")
  //   .select("*, species(name_cn, name_lat)")
  //   .eq("user_id", user.id)
  //   .order("created_at", { ascending: false });

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
        {/* TODO: 从数据库加载 */}
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p className="text-lg mb-2">还没有蚁群</p>
          <p className="text-sm">点击上方按钮创建你的第一个蚁群档案</p>
        </div>
      </div>
    </div>
  );
}
