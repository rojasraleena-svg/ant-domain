import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStageLabel } from "@/lib/labels";
import { deleteColony } from "./actions";

export const metadata = {
  title: "我的蚁群",
  description: "管理和记录你的蚁群成长",
};

export default async function ColoniesPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const { data: colonies } = await db
    .from("colonies")
    .select(
      "*, species(id, name_cn, name_lat, genus_cn, cover_image)"
    )
    .eq("user_id", user.id)
    .eq("status", 1)
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      {/* 页面头部 */}
      <div className="mb-10 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight page-header-bar title-deco">
            我的蚁群
          </h1>
          <p className="mt-4 text-muted-foreground text-base">
            管理和记录你的蚁群成长过程
          </p>
        </div>
        <Link
          href="/colonies/new"
          className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/15 hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          新建蚁群
        </Link>
      </div>

      {/* 蚁群列表 */}
      {!colonies || colonies.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-16 sm:p-20 text-center relative overflow-hidden bg-gradient-warm">
          {/* 装饰 */}
          <div className="absolute inset-0 pointer-events-none opacity-30" aria-hidden="true">
            <svg className="absolute top-8 right-8 w-20 h-20 text-primary/10" viewBox="0 0 32 32" fill="none">
              <ellipse cx="16" cy="22" rx="8" ry="4.5" fill="currentColor" opacity="0.4" />
              <circle cx="16" cy="12" r="5.5" fill="currentColor" opacity="0.4" />
            </svg>
          </div>

          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-primary/40" viewBox="0 0 32 32" fill="none">
                <ellipse cx="16" cy="22" rx="8" ry="4.5" fill="currentColor" opacity="0.6" />
                <circle cx="16" cy="12" r="5.5" fill="currentColor" opacity="0.6" />
                <path d="M13 7.5 Q10 2.5 7.5 4.5 M19 7.5 Q22 2.5 24.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
                <path d="M9 20 L4.5 25.5 M9.5 21.5 L4 24 M10 23 L5.5 27.5 M23 20 L27.5 25.5 M22.5 21.5 L28 24 M22 23 L26.5 27.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
              </svg>
            </div>
            <p className="text-lg font-bold text-foreground/80 mb-2">还没有蚁群</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              创建你的第一个蚁群档案，开始记录成长旅程
            </p>
            <Link
              href="/colonies/new"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/15 hover:bg-primary-dark hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              创建第一个蚁群
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {colonies.map((colony) => (
            <div
              key={colony.id}
              className="group card-hover rounded-2xl border bg-card p-5 sm:p-6 relative overflow-hidden"
            >
              {/* 左侧装饰条 */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-accent-warm rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* 删除按钮 */}
              <form
                action={async () => {
                  "use server";
                  await deleteColony(String(colony.id));
                }}
                className="absolute top-3 right-3 z-10"
              >
                <button
                  type="submit"
                  onClick={(e) => {
                    if (!window.confirm(`确定要删除「${colony.name}」吗？\n删除后将无法恢复，所有关联日志也会被清除。`)) {
                      e.preventDefault();
                    }
                  }}
                  title="删除蚁群"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/8 transition-all duration-200 opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                </button>
              </form>

              <Link href={`/colonies/${colony.id}`} className="block pl-3">
                <div className="flex items-start justify-between pr-8">
                  <div>
                    <h3 className="font-bold group-hover:text-primary transition-colors duration-200 tracking-tight">
                      {colony.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5 italic font-light">
                      {colony.species?.name_cn} · {colony.species?.name_lat}
                    </p>
                  </div>
                </div>

                {/* 状态标签 */}
                <div className="mt-4 pt-3 border-t border-border/40 flex gap-2 flex-wrap text-xs text-muted-foreground pl-0">
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                    {new Date(colony.founded_date).toLocaleDateString("zh-CN")}
                  </span>
                  {colony.worker_range && (
                    <>
                      <span className="text-border">·</span>
                      <span>{colony.worker_range} 工蚁</span>
                    </>
                  )}
                  {colony.current_stage && (
                    <>
                      <span className="text-border">·</span>
                      <span className="text-primary font-medium">{getStageLabel(colony.current_stage)}</span>
                    </>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
