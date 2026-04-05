import Link from "next/link";
import { notFound } from "next/navigation";

// TODO: 从 Supabase 加载阶段数据
const stageData: Record<string, { name: string; icon: string; color: string }> = {
  nuptial_flight: { name: "婚飞", icon: "✈️", color: "#8B5CF6" },
  nesting: { name: "建巢 / 创群", icon: "🏠", color: "#F59E0B" },
  egg: { name: "卵期", icon: "🥚", color: "#EF4444" },
  larva: { name: "幼虫期", icon: "🐛", color: "#F97316" },
  pupa: { name: "蛹期", icon: "🪲", color: "#EAB308" },
  first_workers: { name: "第一批工蚁羽化", icon: "🐜", color: "#22C55E" },
  early_growth: { name: "初级扩群", icon: "📈", color: "#14B8A6" },
  steady_growth: { name: "稳定增长", icon: "🏗️", color: "#0EA5E9" },
  mature: { name: "成熟群体", icon: "👑", color: "#6366F1" },
  hibernation: { name: "季节变化 / 冬眠", icon: "❄️", color: "#94A3B8" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stage: string }>;
}) {
  const { stage } = await params;
  const data = stageData[stage];
  return {
    title: data ? `${data.name} - 生活史` : "生活史",
    description: `弓背蚁 ${data?.name ?? ""} 阶段详解`,
  };
}

export default async function LifecycleStagePage({
  params,
}: {
  params: Promise<{ stage: string }>;
}) {
  const { stage } = await params;
  const data = stageData[stage];

  if (!data) notFound();

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="text-sm text-muted-foreground mb-4">
        <a href="/lifecycle" className="hover:text-foreground">
          生活史
        </a>{" "}
        → {data.name}
      </nav>

      <div className="mb-8 flex items-center gap-4">
        <span className="text-4xl">{data.icon}</span>
        <div>
          <h1 className="text-3xl font-bold">{data.name}</h1>
          <p className="mt-1 text-muted-foreground">弓背蚁属 · 生活史阶段</p>
        </div>
      </div>

      {/* TODO: 从数据库加载并渲染完整的阶段详情内容 */}
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <section>
          <h2 className="font-semibold text-lg">阶段定义</h2>
          <p className="mt-2 text-muted-foreground">
            （此区域将从 life_stages 表加载 definition 字段内容）
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-lg">外显特征</h2>
          <p className="mt-2 text-muted-foreground">
            （加载 external_features）
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-lg">养殖注意事项</h2>
          <p className="mt-2 text-muted-foreground">
            （加载 care_notes）
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-lg">常见误区</h2>
          <p className="mt-2 text-muted-foreground">
            （加载 common_mistakes）
          </p>
        </section>
      </div>

      {/* 模块联动：去记录按钮 */}
      <div className="mt-8 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center">
        <p className="font-medium">你的蚁群走到这个阶段了吗？</p>
        <p className="mt-1 text-sm text-muted-foreground">
          记录你的观察，让 AI 帮你分析蚁群状态
        </p>
        <Link
          href="/colonies/new"
          className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          去记录 →
        </Link>
      </div>

      {/* 前后导航 */}
      <div className="mt-8 flex justify-between">
        <Link
          href="/lifecycle"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 返回总览
        </Link>
      </div>
    </div>
  );
}
