import Link from "next/link";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function ColonyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { id } = await params;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <nav className="text-sm text-muted-foreground mb-4">
        <a href="/colonies" className="hover:text-foreground">
          我的蚁群
        </a>{" "}
        → 蚁群详情 #{id}
      </nav>

      {/* 状态卡片 */}
      <div className="rounded-lg border bg-card p-6 mb-6">
        <h1 className="text-2xl font-bold">蚁群名称</h1>
        <p className="mt-1 text-muted-foreground">
          物种 · 建档日期 · 当前阶段
        </p>
      </div>

      {/* 快速操作 */}
      <div className="grid gap-3 sm:grid-cols-3 mb-6">
        <button className="rounded-lg border bg-card p-3 text-sm hover:bg-accent text-left">
          ✏️ 写日志
        </button>
        <button className="rounded-lg border bg-card p-3 text-sm hover:bg-accent text-left">
          📷 上传照片
        </button>
        <button className="rounded-lg border bg-card p-3 text-sm hover:bg-accent text-left">
          🤖 AI 分析
        </button>
      </div>

      {/* 成长时间线 */}
      <section className="mb-6">
        <h2 className="font-semibold mb-3">成长时间线</h2>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            （时间线将自动汇总关键事件：建档、首次产卵、首批工蚁、搬巢、冬眠等）
          </p>
        </div>
      </section>

      {/* 最近日志 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">最近日志</h2>
          <Link href="#" className="text-sm text-primary hover:underline">
            查看全部
          </Link>
        </div>
        <div className="space-y-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">暂无日志记录</p>
          </div>
        </div>
      </section>
    </div>
  );
}
