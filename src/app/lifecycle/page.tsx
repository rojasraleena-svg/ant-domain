import Link from "next/link";

export const metadata = {
  title: "生活史",
  description: "弓背蚁属完整生命周期 — 从婚飞到成熟群体",
};

// MVP 阶段数据（后续从数据库加载）
const stages = [
  { key: "nuptial_flight", name: "婚飞", icon: "✈️", color: "#8B5CF6", milestone: true },
  { key: "nesting", name: "建巢 / 创群", icon: "🏠", color: "#F59E0B", milestone: true },
  { key: "egg", name: "卵期", icon: "🥚", color: "#EF4444", milestone: false },
  { key: "larva", name: "幼虫期", icon: "🐛", color: "#F97316", milestone: false },
  { key: "pupa", name: "蛹期", icon: "🪲", color: "#EAB308", milestone: false },
  { key: "first_workers", name: "第一批工蚁羽化", icon: "🐜", color: "#22C55E", milestone: true },
  { key: "early_growth", name: "初级扩群", icon: "📈", color: "#14B8A6", milestone: false },
  { key: "steady_growth", name: "稳定增长", icon: "🏗️", color: "#0EA5E9", milestone: false },
  { key: "mature", name: "成熟群体", icon: "👑", color: "#6366F1", milestone: false },
  { key: "hibernation", name: "季节变化 / 冬眠", icon: "❄️", color: "#94A3B8", milestone: true },
];

export default function LifecyclePage() {
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
        <div className="relative">
          {/* 连接线 */}
          <div className="absolute top-8 left-8 right-8 h-0.5 bg-border" />

          <div className="flex justify-between">
            {stages.map((stage, i) => (
              <Link
                key={stage.key}
                href={`/lifecycle/${stage.key}`}
                className="group flex flex-col items-center gap-2 z-10"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 bg-background transition-transform group-hover:scale-110"
                  style={{ borderColor: stage.color }}
                >
                  {stage.icon}
                </div>
                <span className="text-xs text-center max-w-[70px] leading-tight">
                  {stage.name}
                </span>
                {stage.milestone && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: stage.color }}
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
              key={stage.key}
              href={`/lifecycle/${stage.key}`}
              className="group rounded-lg border bg-card p-5 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{stage.icon}</span>
                <div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {stage.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    阶段 {i + 1} / {stages.length}
                  </p>
                </div>
                {stage.milestone && (
                  <span
                    className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: stage.color }}
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
