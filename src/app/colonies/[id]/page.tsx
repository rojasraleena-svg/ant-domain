import Link from "next/link";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateColonyAdvice } from "@/lib/ai";
import { getStageLabel, getAbnormalLabel } from "@/lib/labels";
import { deleteColony } from "../actions";

export default async function ColonyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { id } = await params;

  const { data: colony, error: colonyError } = await db
    .from("colonies")
    .select("*, species(name_cn, name_lat, genus_cn)")
    .eq("id", parseInt(id))
    .eq("user_id", user.id)
    .single();

  if (colonyError || !colony) notFound();

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
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
      {/* 面包屑 */}
      <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5">
        <Link href="/colonies" className="hover:text-primary transition-colors flex items-center gap-1">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
          我的蚁群
        </Link>
        <svg className="w-3.5 h-3.5 text-border" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
        <span className="text-foreground font-medium">{colony.name}</span>
      </nav>

      {/* 状态卡片 */}
      <div className="rounded-2xl border bg-card p-6 sm:p-8 mb-6 shadow-sm relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-bl from-primary/5 to-transparent -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{colony.name}</h1>
              <p className="mt-1.5 text-muted-foreground">
                {colony.species?.name_cn} ·{" "}
                <span className="italic">{colony.species?.name_lat}</span>
              </p>
            </div>
            {colony.current_stage && (
              <span className="rounded-full bg-primary/10 text-primary border border-primary/15 px-3.5 py-1 text-sm font-semibold whitespace-nowrap">
                {getStageLabel(colony.current_stage)}
              </span>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-border/50 flex gap-4 sm:gap-6 text-sm text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
              建档：{new Date(colony.founded_date).toLocaleDateString("zh-CN")}
            </span>
            {colony.worker_range && (
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8" /><path d="M12 6v2m0 8v2" /></svg>
                {colony.worker_range} 工蚁
              </span>
            )}
            {colony.queen_count > 1 && (
              <span>{colony.queen_count} 蚁后</span>
            )}
          </div>

          {/* 删除按钮 */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <form
              action={async () => {
                "use server";
                await deleteColony(id);
              }}
            >
              <button
                type="submit"
                onClick={(e) => {
                  if (!window.confirm("确定要删除这个蚁群吗？\n删除后将无法恢复，所有关联日志也会被清除。")) {
                    e.preventDefault();
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-destructive bg-destructive/6 border border-destructive/15 hover:bg-destructive/10 hover:border-destructive/25 transition-all duration-200"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                删除蚁群
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="grid gap-3 sm:grid-cols-2 mb-6">
        <Link
          href={`/colonies/${id}/log/new`}
          className="group card-hover rounded-xl border bg-card p-4 text-sm hover:border-primary/20 text-left transition-all duration-300"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/8 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/12 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            </div>
            <span className="font-medium">写日志</span>
          </div>
        </Link>
        <button className="group card-hover rounded-xl border bg-card p-4 text-sm hover:border-border text-left cursor-pointer transition-all duration-300 opacity-70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
            </div>
            <span className="font-medium text-muted-foreground">上传照片</span>
            <span className="ml-auto text-[10px] text-muted-foreground/50">即将上线</span>
          </div>
        </button>
      </div>

      {/* AI 分析卡片 */}
      <section className="mb-6 rounded-2xl border-2 border-primary/15 bg-gradient-to-br from-primary/[0.03] to-accent-warm/[0.02] p-5 sm:p-6 relative overflow-hidden">
        {/* 装饰 */}
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/5 blur-xl pointer-events-none" />

        <h2 className="font-bold mb-4 flex items-center gap-2 relative">
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm">
            🤖
          </div>
          AI 分析
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
                  className="rounded-xl bg-background/60 backdrop-blur-sm p-4 text-sm border border-border/30"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-xs text-muted-foreground">
                      {new Date(log.date).toLocaleDateString("zh-CN")}
                    </span>
                    {log.event_type && (
                      <span className="text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium border border-primary/10">
                            {getStageLabel(log.event_type)}
                      </span>
                    )}
                  </div>
                  <p className="leading-relaxed">{log.ai_summary}</p>
                  {log.abnormal_type && log.abnormal_type !== "none" && (
                    <p className="mt-2 text-destructive text-xs flex items-center gap-1 font-medium">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                      检测到异常：{getAbnormalLabel(log.abnormal_type)}
                    </p>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <div className="rounded-xl bg-background/40 p-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-primary/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
            </div>
            <p className="text-sm text-muted-foreground">
              写入第一条日志后，AI 将自动生成分析摘要
            </p>
          </div>
        )}

        {/* AI 建议 */}
        {advice.length > 0 && (
          <div className="mt-4 pt-4 border-t border-primary/10">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-accent-warm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              AI 建议
            </h3>
            <ul className="space-y-2">
              {advice.map((tip, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2.5 leading-relaxed">
                  <span className="text-primary mt-0.5 shrink-0">·</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 成长时间线 */}
      <section className="mb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary to-accent-warm" />
          <h2 className="font-bold">成长时间线</h2>
        </div>
        {logs && logs.length > 0 ? (
          <div className="relative space-y-0 pl-6 ml-1">
            {/* 时间轴主线 */}
            <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-primary/30 via-border to-border" />

            {/* 建档节点 */}
            <div className="relative pb-5">
              <div className="absolute -left-[23px] w-[22px] h-[22px] rounded-full bg-background border-2 border-primary flex items-center justify-center z-10">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div className="ml-2">
                <p className="text-xs text-muted-foreground font-mono">
                  {new Date(colony.founded_date).toLocaleDateString("zh-CN")}
                </p>
                <p className="font-semibold text-sm mt-0.5">建档</p>
              </div>
            </div>

            {/* 日志事件 */}
            {logs.slice(0, 8).map((log) => (
              <div key={log.id} className="relative pb-5 last:pb-0">
                <div
                  className={`absolute -left-[23px] w-[22px] h-[22px] rounded-full bg-background border-2 flex items-center justify-center z-10 ${
                    log.abnormal_type && log.abnormal_type !== "none"
                      ? "border-destructive/60"
                      : "border-border"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    log.abnormal_type && log.abnormal_type !== "none"
                      ? "bg-destructive/60"
                      : "bg-muted-foreground/40"
                  }`} />
                </div>
                <div className="ml-2">
                  <p className="text-xs text-muted-foreground font-mono">
                    {new Date(log.date).toLocaleDateString("zh-CN")}
                  </p>
                  <p className="font-semibold text-sm mt-0.5">{log.title}</p>
                  {log.ai_summary && (
                    <p className="text-xs text-muted-foreground mt-1 italic leading-relaxed pl-2 border-l-2 border-border/40">
                      {log.ai_summary}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">写入日志后将自动生成时间线</p>
          </div>
        )}
      </section>

      {/* 最近日志列表 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-nature-green to-emerald-400" />
            <h2 className="font-bold">最近日志</h2>
          </div>
          <Link
            href={`/colonies/${id}/log/new`}
            className="text-sm text-primary font-medium hover:text-primary-dark transition-colors inline-flex items-center gap-1 group"
          >
            写新日志
            <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
        </div>
        {!logs || logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-muted-foreground/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            </div>
            <p className="text-muted-foreground font-medium mb-1">还没有日志记录</p>
            <Link
              href={`/colonies/${id}/log/new`}
              className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-2 hover:text-primary-dark transition-colors"
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
                className="block rounded-xl border bg-card p-4 hover:bg-accent hover:border-primary/15 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground font-mono">
                    {new Date(log.date).toLocaleDateString("zh-CN")}
                  </span>
                  <div className="flex gap-1.5">
                    {log.stage && (
                      <span className="text-[10px] rounded-full bg-primary/8 text-primary px-2 py-0.5 font-medium border border-primary/10">
                        {getStageLabel(log.stage)}
                      </span>
                    )}
                    {log.abnormal_type &&
                      log.abnormal_type !== "none" && (
                        <span className="text-[10px] rounded-full bg-destructive/8 text-destructive px-2 py-0.5 font-medium border border-destructive/10">
                          异常
                        </span>
                      )}
                  </div>
                </div>
                <p className="text-sm font-medium">{log.title}</p>
                {log.content && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {log.content}
                  </p>
                )}
                {log.ai_summary && (
                  <p className="mt-2 text-xs italic text-primary/70 bg-primary/[0.03] rounded-lg px-3 py-1.5 border border-primary/5">
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
