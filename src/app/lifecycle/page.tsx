import Link from "next/link";
import { getAllLifeStages } from "@/lib/public-data";

export const metadata = {
  title: "生活史",
  description: "弓背蚁属完整生命周期 — 从婚飞到成熟群体",
};

export default async function LifecyclePage() {
  const stages = await getAllLifeStages();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">生活史</h1>
        <p className="mt-2 text-muted-foreground">
          弓背蚁属（Camponotus）完整生命周期 · 从婚飞到成熟群体
        </p>
      </div>

      {/* 时间轴总览 */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-6">生命周期总览</h2>
        <div className="relative overflow-x-auto pb-4">
          {/* 连接线 */}
          <div className="absolute top-8 left-0 right-0 h-0.5 bg-border min-w-max" />

          <div className="flex justify-between gap-3 min-w-max px-2">
            {stages.map((stage) => (
              <Link
                key={stage.stage_key}
                href={`/lifecycle/${stage.stage_key}`}
                className="group flex flex-col items-center gap-2 z-10 min-w-[70px]"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 bg-background transition-transform group-hover:scale-110"
                  style={{ borderColor: stage.color || "#666" }}
                >
                  {stage.icon || "📌"}
                </div>
                <span className="text-xs text-center max-w-[70px] leading-tight font-medium">
                  {stage.name}
                </span>
                {stage.milestone && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full text-white whitespace-nowrap"
                    style={{ backgroundColor: stage.color || "#666" }}
                  >
                    里程碑
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 阶段卡片列表 */}
      <section>
        <h2 className="text-xl font-semibold mb-6">阶段详情</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stages.map((stage, i) => (
            <Link
              key={stage.stage_key}
              href={`/lifecycle/${stage.stage_key}`}
              className="group rounded-lg border bg-card p-5 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{stage.icon || "📌"}</span>
                <div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {stage.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    阶段 {i + 1} / {stages.length}
                    {stage.duration_base && ` · ${stage.duration_base}`}
                  </p>
                </div>
                {stage.milestone && (
                  <span
                    className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full text-white"
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
