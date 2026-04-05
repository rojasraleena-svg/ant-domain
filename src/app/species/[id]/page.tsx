import { notFound } from "next/navigation";

// TODO: 从 Supabase 加载物种数据
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return {
    title: `物种详情 #${id}`,
    description: "蚁域物种资料",
  };
}

export default async function SpeciesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // TODO: const supabase = await createClient();
  // TODO: const { data: species } = await supabase.from("species").select("*").eq("id", id).single();
  // TODO: if (!species) notFound();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <nav className="text-sm text-muted-foreground mb-4">
          <a href="/species" className="hover:text-foreground">
            资料库
          </a>{" "}
          → 物种详情
        </nav>
        {/* TODO: 渲染物种完整信息 */}
        <h1 className="text-3xl font-bold">物种详情 #{id}</h1>
        <p className="mt-2 text-muted-foreground">
          此页面将展示完整的物种资料卡，包括形态特征、饲养建议、生活史关联等。
        </p>

        {/* 生活史入口（模块联动） */}
        <div className="mt-8 rounded-lg border bg-card p-6">
          <h2 className="font-semibold">生活史</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            查看该物种的完整生命周期 →
          </p>
          <a
            href="/lifecycle"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            查看弓背蚁生活史 →
          </a>
        </div>
      </div>
    </div>
  );
}
