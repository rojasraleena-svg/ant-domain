import Link from "next/link";
import { getAllLifeStages, getLifecycleGenera } from "@/lib/public-data";
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
  const [allStages, genera] = await Promise.all([
    getAllLifeStages(),
    getLifecycleGenera(),
  ]);

  const stages = allStages.filter((s) => s.target_genus === selectedGenus);
  const currentGenusName = genera.find((g) => g.genus === selectedGenus)?.name || selectedGenus;

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight page-header-bar title-deco">
          生活史
        </h1>
        <p className="mt-4 text-muted-foreground text-base">
          {currentGenusName}（{selectedGenus}）完整生命周期 · 从婚飞到成熟群体
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-primary/60 to-accent-warm/60" />
          <h2 className="text-sm font-medium text-muted-foreground">选择属</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {genera.map((g) => {
            const isActive = g.genus === selectedGenus;
            return (
              <Link
                key={g.genus}
                href={`/lifecycle?genus=${g.genus}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card border border-border hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                {g.name}
              </Link>
            );
          })}
        </div>
      </div>

      <section className="mb-14">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-accent-warm" />
          <h2 className="text-xl font-bold">生命周期总览</h2>
        </div>

        <div className="hidden sm:block relative overflow-x-auto pb-6 -mx-4 px-4">
          <svg className="absolute top-[26px] left-0 right-0 w-full pointer-events-none overflow-visible" style={{ height: 4 }}>
            <defs>
              <linearGradient id="timeline-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#22C55E" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <line x1="28" y1="2" x2="calc(100% - 28px)" y2="2" stroke="url(#timeline-gradient)" strokeWidth={2} />
          </svg>

          <div className="flex justify-between gap-3 lg:gap-5 min-w-max pt-2">
            {stages.map((stage) => {
              const Icon = stageIcons[stage.stage_key];
              return (
                <Link
                  key={stage.stage_key}
                  href={`/lifecycle/${stage.stage_key}?genus=${selectedGenus}`}
                  className="group flex flex-col items-center gap-2 z-10 min-w-[72px]"
                >
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-xl sm:text-2xl border-2 bg-card shadow-sm transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-lg ${
                      stage.milestone ? "ring-2 ring-offset-2 ring-offset-background" : ""
                    }`}
                    style={{
                      borderColor: stage.color || "#666",
                      backgroundColor: `${stage.color || "#666"}08`,
                      ...(stage.milestone ? { "--tw-ring-color": stage.color || "#666" } as React.CSSProperties : {}),
                    }}
                  >
                    {Icon ? <Icon size={24} style={{ color: stage.color || "#888" }} /> : (stage.icon || "📌")}
                  </div>
                  <span className="text-xs text-center max-w-[72px] leading-snug font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
                    {stage.name}
                  </span>
                  {stage.milestone && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium shadow-sm whitespace-nowrap"
                      style={{ backgroundColor: stage.color || "#666" }}
                    >
                      里程碑
                    </span>
                  )}
                  {stage.duration_base && (
                    <span className="text-[10px] text-muted-foreground/60 hidden lg:block max-w-[72px] text-center leading-tight">
                      {stage.duration_base}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="sm:hidden relative pl-8">
          <div className="absolute left-[15px] top-2 bottom-2 w-[2px]" style={{
            background: "linear-gradient(to bottom, #8B5CF640, #F59E0B40, #EF444440, #22C55E40, #94A3B840)",
          }} />

          <div className="flex flex-col gap-4">
            {stages.map((stage) => {
              const Icon = stageIcons[stage.stage_key];
              return (
                <Link
                  key={stage.stage_key}
                  href={`/lifecycle/${stage.stage_key}?genus=${selectedGenus}`}
                  className="group flex items-center gap-4 relative"
                >
                  <div
                    className={`absolute -left-8 w-8 h-8 rounded-xl border-2 bg-card flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 ${
                      stage.milestone ? "shadow-md" : ""
                    }`}
                    style={{
                      borderColor: stage.color || "#666",
                      backgroundColor: `${stage.color || "#666"}10`,
                    }}
                  >
                    {Icon ? <Icon size={16} style={{ color: stage.color || "#888" }} /> : <span className="text-xs">{stage.icon}</span>}
                  </div>

                  <div className="flex-1 min-w-0 py-1.5 border-b border-border/30 last:border-0 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm group-hover:text-primary transition-colors">{stage.name}</span>
                      {stage.milestone && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full text-white font-medium shrink-0"
                          style={{ backgroundColor: stage.color || "#666" }}
                        >
                          里程碑
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                      {stage.definition || stage.duration_base || ""}
                    </p>
                    {stage.duration_base && (
                      <span className="text-[10px] text-muted-foreground/50 mt-0.5 inline-block">{stage.duration_base}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-nature-green to-emerald-400" />
          <h2 className="text-xl font-bold">阶段详情</h2>
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
