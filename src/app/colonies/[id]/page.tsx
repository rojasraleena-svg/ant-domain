import Link from "next/link";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateColonyAdvice } from "@/lib/ai";

export default async function ColonyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { id } = await params;

  // 加载蚁群信息
  const { data: colony, error: colonyError } = await db
    .from("colonies")
    .select("*, species(name_cn, name_lat, genus_cn)")
    .eq("id", parseInt(id))
    .eq("user_id", user.id)
    .single();

  if (colonyError || !colony) notFound();

  // 加载最近日志（含 AI 摘要）
  const { data: logs } = await db
    .from("colony_logs")
    .select("*")
    .eq("colony_id", parseInt(id))
    .order("date", { ascending: false })
    .limit(10);

  // AI 建议（实时生成）
  let advice: string[] = [];
  try {
    advice = await generateColonyAdvice(
      colony.name,
      colony.species?.name_cn || "",
      colony.current_stage || null,
      (logs ?? []).map((l) => ({
        title: l.title,
        content: l.content || "",
        date: new Date(l.date).toLocaleDateString("zh-CN"),
      }))
    );
  } catch {
    advice = ["继续保持观察，定期记录蚁群变化"];
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* 面包屑 */}
      <nav className="text-sm text-muted-foreground mb-4">
        <a href="/colonies" className="hover:text-foreground">
          我的蚁群
        </a>{" "}
        → {colony.name}
      </nav>

      {/* 状态卡片 */}
      <div className="rounded-lg border bg-card p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">{colony.name}</h1>
            <p className="mt-1 text-muted-foreground">
              {colony.species?.name_cn} ·{" "}
              <span className="italic">{colony.species?.name_lat}</span>
            </p>
          </div>
          {colony.current_stage && (
            <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-medium">
              {colony.current_stage}
            </span>
          )}
        </div>

        <div className="mt-3 flex gap-4 text-sm text-muted-foreground flex-wrap">
          <span>建档：{new Date(colony.founded_date).toLocaleDateString("zh-CN")}</span>
          {colony.worker_range && (
            <>
              <span>·</span>
              <span>{colony.worker_range} 工蚁</span>
            </>
          )}
          {colony.queen_count > 1 && (
            <>
              <span>·</span>
              <span>{colony.queen_count} 蚁后</span>
            </>
          )}
        </div>
      </div>

      {/* 快速操作 */}
      <div className="grid gap-3 sm:grid-cols-3 mb-6">
        <Link
          href={`/colonies/${id}/log/new`}
          className="rounded-lg border bg-card p-3 text-sm hover:bg-accent text-left transition-colors"
        >
          ✏️ 写日志
        </Link>
        <button className="rounded-lg border bg-card p-3 text-sm hover:bg-accent text-left cursor-pointer">
          📷 上传照片（即将上线）
        </button>
      </div>

      {/* AI 分析卡片 */}
      <section className="mb-6 rounded-lg border-2 border-primary/20 bg-primary/5 p-5">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          🤖 AI 分析
        </h2>

        {/* 最近日志的 AI 摘要 */}
        {logs && logs.length > 0 ? (
          <div className="space-y-3">
            {logs
              .filter((l) => l.ai_summary)
              .slice(0, 3)
              .map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg bg-background/50 p-3 text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-xs text-muted-foreground">
                      {new Date(log.date).toLocaleDateString("zh-CN")}
                    </span>
                    {log.event_type && (
                      <span className="text-[10px] rounded-full bg-primary/20 text-primary px-1.5 py-0.5">
                        {log.event_type}
                      </span>
                    )}
                  </div>
                  <p>{log.ai_summary}</p>
                  {log.abnormal_type && log.abnormal_type !== "none" && (
                    <p className="mt-1 text-destructive text-xs">
                      ⚠️ 检测到异常：{log.abnormal_type}
                    </p>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            写入第一条日志后，AI 将自动生成分析摘要
          </p>
        )}

        {/* AI 建议 */}
        {advice.length > 0 && (
          <div className="mt-4 pt-4 border-t border-primary/20">
            <h3 className="text-sm font-medium mb-2">💡 AI 建议</h3>
            <ul className="space-y-1">
              {advice.map((tip, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-primary">·</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 成长时间线 */}
      <section className="mb-6">
        <h2 className="font-semibold mb-3">成长时间线</h2>
        {logs && logs.length > 0 ? (
          <div className="relative space-y-4 pl-4 border-l-2 border-border ml-2">
            {/* 建档节点 */}
            <div className="relative">
              <div className="absolute -left-[9px] w-4 h-4 rounded-full bg-background border-2 border-primary" />
              <div className="ml-4">
                <p className="text-xs text-muted-foreground">
                  {new Date(colony.founded_date).toLocaleDateString("zh-CN")}
                </p>
                <p className="font-medium text-sm">建档</p>
              </div>
            </div>

            {/* 日志事件 */}
            {logs.slice(0, 8).map((log) => (
              <div key={log.id} className="relative">
                <div
                  className={`absolute -left-[9px] w-4 h-4 rounded-full ${
                    log.abnormal_type && log.abnormal_type !== "none"
                      ? "bg-destructive/30 border-destructive/50"
                      : "bg-muted"
                  } border-2`}
                />
                <div className="ml-4">
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.date).toLocaleDateString("zh-CN")}
                  </p>
                  <p className="font-medium text-sm">{log.title}</p>
                  {log.ai_summary && (
                    <p className="text-xs text-muted-foreground mt-0.5 italic">
                      {log.ai_summary}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              写入日志后将自动生成时间线
            </p>
          </div>
        )}
      </section>

      {/* 最近日志列表 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">最近日志</h2>
          <Link
            href={`/colonies/${id}/log/new`}
            className="text-sm text-primary hover:underline"
          >
            + 写新日志
          </Link>
        </div>
        {!logs || logs.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            <p className="text-lg mb-2">还没有日志记录</p>
            <Link
              href={`/colonies/${id}/log/new`}
              className="inline-block text-primary hover:underline"
            >
              写入第一条日志 →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <Link
                key={log.id}
                href="#"
                className="block rounded-lg border bg-card p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.date).toLocaleDateString("zh-CN")}
                  </span>
                  <div className="flex gap-2">
                    {log.stage && (
                      <span className="text-[10px] rounded-full bg-primary/10 text-primary px-1.5 py-0.5">
                        {log.stage}
                      </span>
                    )}
                    {log.abnormal_type &&
                      log.abnormal_type !== "none" && (
                        <span className="text-[10px] rounded-full bg-destructive/10 text-destructive px-1.5 py-0.5">
                          异常
                        </span>
                      )}
                  </div>
                </div>
                <p className="text-sm">{log.title}</p>
                {log.content && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {log.content}
                  </p>
                )}
                {log.ai_summary && (
                  <p className="mt-1 text-xs italic text-primary/80 bg-primary/5 rounded px-2 py-1">
                    🤖 {log.ai_summary}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
