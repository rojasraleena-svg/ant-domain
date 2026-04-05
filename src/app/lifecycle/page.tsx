import Link from "next/link";
import { getAllLifeStages, getLifecycleGenera, getGenusCnName } from "@/lib/public-data";
import {
  Plane,
  Home,
  CircleDot,
  Bug,
  Shell,
  UserPlus,
  TrendingUp,
  Building2,
  Crown,
  Snowflake,
  type LucideIcon,
} from "lucide-react";

const stageIcons: Record<string, LucideIcon> = {
  nuptial_flight: Plane,
  nesting: Home,
  egg: CircleDot,
  larva: Bug,
  pupa: Shell,
  first_workers: UserPlus,
  early_growth: TrendingUp,
  steady_growth: Building2,
  mature: Crown,
  hibernation: Snowflake,
};

export const metadata = {
  title: "生活史",
  description: "蚂蚁完整生命周期 — 从婚飞到成熟群体，支持多属对比",
};

interface LifecyclePageProps {
  searchParams: Promise<{ genus?: string }>;
}

export default async function LifecyclePage({ searchParams }: LifecyclePageProps) {
  const { genus: selectedGenus = "Camponotus" } = await searchParams;
  const [stages, genera] = await Promise.all([
    getAllLifeStages(),
    getLifecycleGenera(),
  ]);

  const currentGenusName = getGenusCnName(selectedGenus);

  return (
    <div className="container mx-auto px-4 py-12 sm:py-20 animate-fade-in relative">
      {/* 装饰元素 */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-accent-warm/5 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

      {/* 头部 */}
      <div className="mb-14 relative z-10 flex flex-col md:flex-row items-end justify-between gap-6 pb-12 border-b border-white/5">
        <div className="max-w-3xl">
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground/30 mix-blend-overlay">
            演化图谱<span className="text-primary/50 text-4xl align-top">.</span>
          </h1>
          <p className="text-muted-foreground/60 text-base sm:text-xl font-light tracking-widest max-w-xl leading-relaxed">
            <span className="text-foreground/90 font-medium">{currentGenusName}</span> <span className="font-mono text-[13px] opacity-50 mx-2">/* {selectedGenus} */</span> <br className="hidden sm:block" />生命周期解码，从婚飞基石到成熟生态网络。
          </p>
        </div>
      </div>

      {/* 属选择器 (Glass Tabs) */}
      <div className="mb-20 relative z-10">
        <div className="flex items-center gap-3 mb-6 opacity-80">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">切换观测对象属</h2>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {genera.map((g) => {
            const isActive = g.genus === selectedGenus;
            return (
              <Link
                key={g.genus}
                href={`/lifecycle?genus=${g.genus}`}
                className={`relative group px-5 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-500 overflow-hidden ${
                  isActive
                    ? "text-primary/90 border border-primary/30 shadow-[0_0_30px_rgba(255,100,50,0.15)] bg-primary/10 backdrop-blur-xl"
                    : "text-muted-foreground/50 border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:text-foreground/80 backdrop-blur-md"
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {g.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 生命周期时间线 (Glassmorphic Hex Grid) */}
      <section className="mb-24 relative z-10">
        <div className="flex items-center gap-3 mb-12 opacity-80">
           <div className="w-1.5 h-1.5 rounded-full bg-accent-warm animate-ping" />
           <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">发育时间线拓扑图</h2>
        </div>

        {/* 桌面端横向展示 */}
        <div className="hidden sm:block relative overflow-x-auto pb-16 mask-edges [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* 星云连线背景 - 更纤细 */}
          <div className="absolute top-[40%] left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-y-1/2 z-0" />
          <div className="absolute top-[40%] left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-y-1/2 z-0 blur-[3px]" />

          <div className="flex justify-between gap-6 lg:gap-10 min-w-max pt-8 pb-10 px-12 relative z-10 w-fit mx-auto items-start">
            {stages.map((stage, idx) => {
              const Icon = stageIcons[stage.stage_key];
              const isEven = idx % 2 === 0;
              
              return (
                <Link
                  key={stage.stage_key}
                  href={`/lifecycle/${stage.stage_key}?genus=${selectedGenus}`}
                  className={`group flex flex-col items-center relative w-[110px] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] filter grayscale-[30%] hover:grayscale-0 ${isEven ? 'translate-y-4' : '-translate-y-8'} hover:z-20`}
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  {/* 连接点 */}
                  <div className={`absolute left-1/2 -ml-px w-px h-8 bg-gradient-to-b from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity ${isEven ? 'top-[-32px]' : 'bottom-[-32px] bg-gradient-to-t'}`} />

                  {/* 核心玻璃态节点 */}
                  <div
                    className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] flex items-center justify-center mb-5 border border-white/5 bg-black/30 backdrop-blur-2xl shadow-xl transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-2 group-hover:border-white/20 group-hover:bg-white/5 ${
                      stage.milestone ? "ring-1 ring-primary/20" : ""
                    }`}
                    style={{
                      boxShadow: `0 20px 40px -10px ${stage.color || "#ffffff"}15, inset 0 1px 1px 0 rgba(255,255,255,0.1)`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-[2rem] pointer-events-none group-hover:from-white/10 transition-colors" />
                    {Icon ? <Icon size={32} strokeWidth={1.5} style={{ color: stage.color || "#888" }} className="drop-shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:stroke-2" /> : (stage.icon || "📌")}
                  </div>
                  
                  {/* 节点文本摘要 */}
                  <div className="flex flex-col items-center text-center px-1">
                    <span className="text-sm font-black tracking-widest text-foreground/70 group-hover:text-foreground transition-colors mb-2 whitespace-nowrap truncate max-w-full drop-shadow-sm">
                      {stage.name}
                    </span>
                    {stage.milestone && (
                      <span
                        className="text-[8px] uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full font-bold shadow-sm mb-2 backdrop-blur-md"
                        style={{ backgroundColor: `${stage.color}10`, color: stage.color || "#fff", border: `1px solid ${stage.color}30` }}
                      >
                        Milestone
                      </span>
                    )}
                    {stage.duration_base && (
                      <span className="text-[10px] text-muted-foreground/40 font-mono tracking-tight">
                        {stage.duration_base}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 移动端纵向展示 */}
        <div className="sm:hidden relative pl-10 pt-4">
          <div className="absolute left-[35px] top-6 bottom-6 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          <div className="absolute left-[35px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-transparent via-primary/20 to-transparent blur-[2px]" />

          <div className="flex flex-col gap-10 relative z-10">
            {stages.map((stage, idx) => {
              const Icon = stageIcons[stage.stage_key];
              return (
                <Link
                  key={stage.stage_key}
                  href={`/lifecycle/${stage.stage_key}?genus=${selectedGenus}`}
                  className="group flex flex-col gap-3 relative stagger-animate fade-in-up"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="absolute top-6 -left-[28px] w-4 h-px bg-white/20" />
                  <div className="absolute top-[22px] -left-[32px] w-2 h-2 rounded-full bg-background border border-white/40 group-hover:border-primary group-hover:bg-primary transition-colors" />

                  <div className="flex gap-5 items-center bg-card/10 backdrop-blur-sm border border-white/5 p-4 rounded-3xl hover:bg-card/30 transition-all duration-300">
                    <div
                      className={`relative w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 bg-black/40 shadow-inner group-hover:scale-105 transition-transform ${
                        stage.milestone ? "ring-1 ring-primary/30 ring-offset-2 ring-offset-background" : ""
                      }`}
                      style={{ boxShadow: `inset 0 0 15px ${stage.color || "#ffffff"}20` }}
                    >
                      {Icon ? <Icon size={24} style={{ color: stage.color || "#888" }} /> : <span className="text-xl">{stage.icon}</span>}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 cursor-[12px]">
                        <span className="font-bold text-lg text-foreground/90 group-hover:text-primary transition-colors">{stage.name}</span>
                        {stage.milestone && (
                          <span
                            className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded font-bold"
                            style={{ backgroundColor: `${stage.color}15`, color: stage.color || "#fff", border: `1px solid ${stage.color}30` }}
                          >
                            Milestone
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground/60 line-clamp-2 leading-relaxed">
                        {stage.definition || stage.duration_base || ""}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 阶段详情 (下半部分保持不变或由其他部分渲染) */}
      <section className="relative z-10">
        <div className="flex items-center gap-3 mb-6 pt-10 border-t border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-nature-green/60 blur-[2px] animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-nature-green absolute" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">阶段全息档案</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stages.map((stage, i) => {
            const Icon = stageIcons[stage.stage_key];
            const isMilestone = !!stage.milestone;

            return (
              <Link
                key={stage.stage_key}
                href={`/lifecycle/${stage.stage_key}?genus=${selectedGenus}`}
                className={`group card-hover rounded-2xl border bg-card p-5 sm:p-6 relative overflow-hidden transition-all duration-300 ${
                  isMilestone ? "border-opacity-60 hover:border-opacity-100" : ""
                }`}
                style={{ borderColor: isMilestone ? (stage.color || "#666") + "40" : undefined }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ backgroundColor: stage.color || "#666" }}
                />
                {isMilestone && (
                  <div
                    className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at top right, ${stage.color || "#666"}, transparent 70%)`,
                    }}
                  />
                )}

                <div className="flex items-start gap-3.5 pl-3 relative z-10">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-110 ${
                      isMilestone ? "shadow-sm" : ""
                    }`}
                    style={{
                      borderColor: (stage.color || "#666") + "30",
                      backgroundColor: isMilestone ? (stage.color || "#666") + "12" : (stage.color || "#666") + "0a",
                    }}
                  >
                    {Icon ? <Icon size={20} style={{ color: stage.color || "#888" }} /> : (stage.icon || "📌")}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold group-hover:text-primary transition-colors duration-200 truncate">
                        {stage.name}
                      </h3>
                      {isMilestone && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full text-white font-medium shrink-0"
                          style={{ backgroundColor: stage.color || "#666" }}
                        >
                          里程碑
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      阶段 {String(i + 1).padStart(2, "0")} / {String(stages.length).padStart(2, "0")}
                      {stage.duration_base && ` · ${stage.duration_base}`}
                    </p>
                    {stage.definition && (
                      <p className="text-xs text-muted-foreground/75 mt-2 line-clamp-2 leading-relaxed">
                        {stage.definition}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
