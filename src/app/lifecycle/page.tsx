import Link from "next/link";
import { getAllLifeStages } from "@/lib/public-data";

export const metadata = {
  title: "生活史",
  description: "弓背蚁属完整生命周期 — 从婚飞到成熟群体",
};

export default async function LifecyclePage() {
  const stages = await getAllLifeStages();

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      {/* 页面头部 */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight page-header-bar title-deco">
          生活史
        </h1>
        <p className="mt-4 text-muted-foreground text-base">
          弓背蚁属（Camponotus）完整生命周期 · 从婚飞到成熟群体
        </p>
      </div>

      {/* 时间轴总览 */}
      <section className="mb-14">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-accent-warm" />
          <h2 className="text-xl font-bold">生命周期总览</h2>
        </div>
        <div className="relative overflow-x-auto pb-6 -mx-4 px-4">
          {/* 连接线 */}
          <div className="absolute top-[26px] left-4 right-4 h-[2px] bg-gradient-to-r from-primary/20 via-primary/30 to-accent-warm/20 min-w-max" />

          <div className="flex justify-between gap-4 sm:gap-6 min-w-max pt-2">
            {stages.map((stage, i) => (
              <Link
                key={stage.stage_key}
                href={`/lifecycle/${stage.stage_key}`}
                className="group flex flex-col items-center gap-2.5 z-10 min-w-[72px]"
              >
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-xl sm:text-2xl border-2 bg-card shadow-sm transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-md"
                  style={{
                    borderColor: stage.color || "#666",
                    backgroundColor: `${stage.color || "#666"}08`,
                  }}
                >
                  {stage.icon || "📌"}
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
                {/* 阶段编号 */}
                <span className="text-[10px] text-muted-foreground/50 font-mono">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 阶段卡片列表 */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-nature-green to-emerald-400" />
          <h2 className="text-xl font-bold">阶段详情</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stages.map((stage, i) => (
            <Link
              key={stage.stage_key}
              href={`/lifecycle/${stage.stage_key}`}
              className="group card-hover rounded-2xl border bg-card p-5 sm:p-6 relative overflow-hidden"
            >
              {/* 左侧色条 */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                style={{ backgroundColor: stage.color || "#666" }}
              />

              <div className="flex items-center gap-3.5 pl-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 border transition-transform duration-300 group-hover:scale-110"
                  style={{
                    borderColor: (stage.color || "#666") + "30",
                    backgroundColor: (stage.color || "#666") + "0a",
                  }}
                >
                  {stage.icon || "📌"}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold group-hover:text-primary transition-colors duration-200 truncate">
                    {stage.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    阶段 {String(i + 1).padStart(2, "0")} / {String(stages.length).padStart(2, "0")}
                    {stage.duration_base && ` · ${stage.duration_base}`}
                  </p>
                </div>
                {stage.milestone && (
                  <span
                    className="ml-auto text-[10px] px-2 py-0.5 rounded-full text-white font-medium shrink-0"
                    style={{ backgroundColor: stage.color || "#666" }}
                  >
                    里程碑
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
