import Link from "next/link";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateColonyAdvice } from "@/lib/ai";
import { getStageLabel, getAbnormalLabel } from "@/lib/labels";
import { DeleteColonyButton } from "../components/DeleteColonyButton";
import { LogImageGallery } from "@/components/log-image-gallery";

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

  // 检查是否有任何日志包含图片
  const hasAnyImages =
    logs && logs.some((l) => l.images && Array.isArray(l.images) && l.images.length > 0);

  // 收集所有有图片的日志（用于画廊展示）
  const logsWithImages = (logs ?? [])
    .filter((l) => l.images && Array.isArray(l.images) && l.images.length > 0)
    .map((l) => ({
      date: new Date(l.date).toLocaleDateString("zh-CN").replace(/\//g, "."),
      title: l.title,
      images: l.images as { url: string }[],
    }));

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
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-12 animate-fade-in">
      {/* 面包屑 */}
      <nav className="text-xs font-medium tracking-widest text-muted-foreground/60 mb-8 flex items-center gap-2 uppercase">
        <Link href="/colonies" className="hover:text-primary transition-colors flex items-center gap-1.5 focus-ring">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          返回群落矩阵
        </Link>
        <span className="w-1 h-1 rounded-full bg-border/40" />
        <span className="text-foreground/80 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse-slow shadow-[0_0_8px_rgba(255,100,50,0.5)]"></span>
          当前观测目标
        </span>
      </nav>

      {/* 头像与概要卡片 (Hero Profile) */}
      <div className="relative rounded-[2rem] border border-white/10 bg-card/10 backdrop-blur-2xl p-8 sm:p-12 mb-10 overflow-hidden group hover:border-white/20 transition-all duration-700">
        {/* 环境光学效果 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-primary/30 transition-colors duration-1000" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-warm/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 md:items-end justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-muted-foreground shadow-inner">
                COLONY // {colony.id}
              </span>
              {colony.current_stage && (
                <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold tracking-widest uppercase text-primary shadow-[0_0_15px_rgba(255,100,50,0.15)] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {getStageLabel(colony.current_stage)}
                </span>
              )}
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground">
              {colony.name}
            </h1>
            
            <p className="text-lg text-primary/80 font-medium italic tracking-wide flex items-center gap-3">
              {colony.species?.name_cn}
              <span className="w-1 h-1 rounded-full bg-border/40" />
              <span className="text-muted-foreground/50 font-light text-base not-italic">
                {colony.species?.name_lat}
              </span>
            </p>
          </div>

          {/* 重点指标 */}
          <div className="flex flex-wrap gap-4 md:grid md:grid-cols-2 md:gap-4 shrink-0">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 min-w-[120px] backdrop-blur-md">
               <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 block mb-1">规模刻度</span>
               <div className="flex items-baseline gap-1.5">
                 <span className="text-2xl font-black">{colony.worker_range || "N/A"}</span>
                 <span className="text-xs text-muted-foreground/50 font-medium">工蚁</span>
               </div>
            </div>
            {colony.queen_count > 0 && (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 min-w-[120px] backdrop-blur-md">
                 <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 block mb-1">核心节点</span>
                 <div className="flex items-baseline gap-1.5">
                   <span className="text-2xl font-black">{colony.queen_count}</span>
                   <span className="text-xs text-muted-foreground/50 font-medium">蚁后</span>
                 </div>
              </div>
            )}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 min-w-[120px] backdrop-blur-md col-span-full">
               <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 block mb-1">建档时间</span>
               <span className="text-xl font-mono text-foreground/80 tracking-tight">
                 {new Date(colony.founded_date).toLocaleDateString("zh-CN").replace(/\//g, '.')}
               </span>
            </div>
          </div>
        </div>

        {/* 覆盖全局的删除按钮，置于右上角 */}
        <div className="absolute top-6 right-6 z-20">
          <DeleteColonyButton colonyId={parseInt(id)} colonyName={colony.name} />
        </div>
      </div>

      {/* 控制面板 (Bento Box Actions) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        <Link
          href={`/colonies/${id}/log/new`}
          className="col-span-2 sm:col-span-2 group relative rounded-2xl bg-primary/10 border border-primary/20 p-6 overflow-hidden transition-all duration-500 hover:bg-primary/20 hover:border-primary/40 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(255,100,50,0.15)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative z-10 flex items-center justify-between h-full">
            <div>
              <h3 className="text-lg font-bold text-primary mb-1 tracking-tight flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                新增观测日志
              </h3>
              <p className="text-xs text-primary/60 font-medium">唤醒传感器，记录群落最新动态与异常事件。</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
              <svg className="w-5 h-5 -rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </div>
          </div>
        </Link>
        
        {hasAnyImages ? (
          <Link
            href="#log-gallery"
            className="col-span-2 sm:col-span-1 group relative rounded-2xl bg-primary/10 border border-primary/20 p-6 overflow-hidden transition-all duration-500 hover:bg-primary/20 hover:border-primary/40"
          >
            <div className="relative z-10 flex flex-col h-full justify-center">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-3">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              </div>
              <h3 className="text-sm font-bold text-primary mb-1">影像归档</h3>
              <p className="text-[10px] text-primary/60 uppercase tracking-widest">{logsWithImages.reduce((sum, l) => sum + l.images.length, 0)} 张影像</p>
            </div>
          </Link>
        ) : (
        <div className="col-span-2 sm:col-span-1 group relative rounded-2xl bg-card/10 border border-white/5 p-6 overflow-hidden transition-all duration-500 opacity-50">
           <div className="relative z-10 flex flex-col h-full justify-center">
             <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-muted-foreground mb-3">
               <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
             </div>
             <h3 className="text-sm font-bold text-foreground/70 mb-1">影像归档</h3>
             <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">暂无影像</p>
           </div>
        </div>
        )}
      </div>

      {/* 核心数据区 */}
      <div className="grid lg:grid-cols-5 gap-6 mb-10">
        
        {/* 左侧：AI 解析中枢 */}
        <section className="lg:col-span-3 relative rounded-[2rem] border border-white/10 bg-card/20 backdrop-blur-xl p-8 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black tracking-tight flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(255,100,50,0.2)]">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /><circle cx="12" cy="12" r="4" /></svg>
                </span>
                中枢分析矩阵
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/50 animate-pulse">Live Link Active</span>
            </div>

            {logs && logs.length > 0 ? (
              <div className="space-y-4">
                {logs.filter(l => l.ai_summary).slice(0, 2).map((log, i) => (
                  <div key={log.id} className="relative rounded-2xl bg-black/20 border border-white/5 p-5 transition-all hover:bg-black/30 hover:border-white/10">
                    <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
                      <span className="text-xs font-mono text-muted-foreground/60">{new Date(log.date).toLocaleDateString("zh-CN").replace(/\//g, '.')}</span>
                      {log.event_type && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-primary/80 bg-primary/10 px-2 py-1 rounded border border-primary/20">
                          {getStageLabel(log.event_type)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed font-light selection:bg-primary/30">
                      {log.ai_summary}
                    </p>
                    {log.abnormal_type && log.abnormal_type !== "none" && (
                      <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 flex gap-2 items-start">
                        <svg className="w-4 h-4 text-destructive shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        <p className="text-xs text-destructive font-medium leading-tight">
                          <span className="block opacity-70 mb-0.5 text-[10px] uppercase tracking-wider">Alert</span>
                          {getAbnormalLabel(log.abnormal_type)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center bg-black/10">
                <p className="text-sm text-muted-foreground/60 font-light">中枢等待数据输入。产生首条日志后将开始演算。</p>
              </div>
            )}

            {/* 专家建议 */}
            {advice.length > 0 && (
               <div className="mt-6 pt-6 border-t border-white/5">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mb-4 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-accent-warm" />
                   执行建议 Protocol
                 </h3>
                 <ul className="space-y-3">
                   {advice.map((tip, i) => (
                     <li key={i} className="text-sm text-foreground/80 font-light leading-relaxed flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/5">
                       <span className="text-accent-warm font-mono text-[10px] bg-accent-warm/10 px-1.5 py-0.5 rounded opacity-70 mt-0.5">0{i+1}</span>
                       {tip}
                     </li>
                   ))}
                 </ul>
               </div>
            )}
          </div>
        </section>

        {/* 右侧：日志记录舱 */}
        <section className="lg:col-span-2 relative rounded-[2rem] border border-white/10 bg-card/10 backdrop-blur-md p-8 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-3">
              <span className="w-1 h-6 rounded-full bg-gradient-to-b from-nature-green to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]" />
              观测日志池
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {!logs || logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-10">
                <svg className="w-10 h-10 text-muted-foreground mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                <p className="text-xs tracking-widest uppercase font-bold text-muted-foreground">尚未记录</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <Link
                    key={log.id}
                    href="#"
                    className="block group rounded-xl bg-black/20 border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-mono text-muted-foreground/60">{new Date(log.date).toLocaleDateString("zh-CN").replace(/\//g, '.')}</span>
                       <div className="flex gap-1.5">
                         {log.stage && <span className="w-1.5 h-1.5 rounded-full bg-primary" title={getStageLabel(log.stage)}/>}
                         {log.abnormal_type && log.abnormal_type !== "none" && <span className="w-1.5 h-1.5 rounded-full bg-destructive" title="异常"/>}
                       </div>
                    </div>
                    <h4 className="text-sm font-bold text-foreground/90 group-hover:text-primary transition-colors">{log.title}</h4>
                    {log.images && Array.isArray(log.images) && log.images.length > 0 && (
                      <div className="mt-2 rounded-lg overflow-hidden bg-black/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={log.images[0].url}
                          alt=""
                          className="w-full h-16 object-cover"
                        />
                        {log.images.length > 1 && (
                          <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-black/60 text-white/70 px-1.5 rounded">
                            +{log.images.length - 1}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 影像归档画廊 */}
      {logsWithImages.length > 0 && (
        <section id="log-gallery" className="mt-10 space-y-6">
          <h2 className="text-xl font-black tracking-tight flex items-center gap-3">
            <span className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-nature-green shadow-[0_0_10px_rgba(255,100,50,0.3)]" />
            观测影像档案
          </h2>
          {logsWithImages.map((log) => (
            <LogImageGallery
              key={log.date + log.title}
              images={log.images}
              logDate={log.date}
              logTitle={log.title}
            />
          ))}
        </section>
      )}
    </div>
  );
}
