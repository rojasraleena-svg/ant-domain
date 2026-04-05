import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = {
  title: "我的蚁群",
  description: "管理和记录你的蚁群成长",
};

export default async function ColoniesPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  // 加载用户的蚁群列表（含物种信息）
  const { data: colonies } = await db
    .from("colonies")
    .select(
      "*, species(id, name_cn, name_lat, genus_cn, cover_image)"
    )
    .eq("user_id", user.id)
    .eq("status", 1)
    .order("created_at", { ascending: false });

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
      {!colonies || colonies.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <p className="text-lg mb-2">还没有蚁群</p>
          <p className="text-sm">点击上方按钮创建你的第一个蚁群档案</p>
          <Link
            href="/colonies/new"
            className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            创建第一个蚁群
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {colonies.map((colony) => (
            <Link
              key={colony.id}
              href={`/colonies/${colony.id}`}
              className="group rounded-lg border bg-card p-5 transition-colors hover:bg-accent"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {colony.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5 italic">
                    {colony.species?.name_cn} · {colony.species?.name_lat}
                  </p>
                </div>
              </div>

              {/* 状态标签 */}
              <div className="mt-3 flex gap-2 flex-wrap text-xs text-muted-foreground">
                <span>建档：{new Date(colony.founded_date).toLocaleDateString("zh-CN")}</span>
                {colony.worker_range && (
                  <>
                    <span>·</span>
                    <span>{colony.worker_range} 工蚁</span>
                  </>
                )}
                {colony.current_stage && (
                  <>
                    <span>·</span>
                    <span className="text-primary">{colony.current_stage}</span>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
