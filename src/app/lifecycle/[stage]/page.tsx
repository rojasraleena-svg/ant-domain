import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllLifeStages, getLifeStageByKey } from "@/lib/public-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stage: string }>;
}) {
  const { stage: key } = await params;

  try {
    const data = await getLifeStageByKey(key);
    return {
      title: `${data.name} - 生活史`,
      description: `弓背蚁 ${data.name} 阶段详解`,
    };
  } catch {
    return { title: "生活史", description: "蚁域" };
  }
}

export default async function LifecycleStagePage({
  params,
}: {
  params: Promise<{ stage: string }>;
}) {
  const { stage: key } = await params;

  let stage;
  try {
    stage = await getLifeStageByKey(key);
  } catch {
    notFound();
  }

  const allStages = await getAllLifeStages();
  const currentIndex = allStages.findIndex((s) => s.stage_key === key);
  const prevStage = currentIndex > 0 ? allStages[currentIndex - 1] : null;
  const nextStage =
    currentIndex < allStages.length - 1 ? allStages[currentIndex + 1] : null;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/lifecycle" className="hover:text-foreground">
          生活史
        </Link>{" "}
        {"->"} {stage.name}
      </nav>

      <div className="mb-8 flex items-center gap-4">
        <span
          className="text-5xl w-16 h-16 rounded-full flex items-center justify-center border-2"
          style={{
            borderColor: stage.color || "#666",
            backgroundColor: `${stage.color || "#666"}15`,
          }}
        >
          {stage.icon || "🔶"}
        </span>
        <div>
          <h1 className="text-3xl font-bold">{stage.name}</h1>
          <p className="mt-1 text-muted-foreground">
            弓背蚁属 · 阶段 {currentIndex + 1} / {allStages.length}
            {stage.milestone && (
              <span
                className="ml-2 text-xs px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: stage.color || "#666" }}
              >
                里程碑
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {stage.definition && (
          <section className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold text-lg mb-3">阶段定义</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {stage.definition}
            </p>
          </section>
        )}

        {stage.external_features && (
          <section className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold text-lg mb-3">外显特征</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {stage.external_features}
            </p>
          </section>
        )}

        {stage.common_behaviors && (
          <section className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold text-lg mb-3">常见行为</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {stage.common_behaviors}
            </p>
          </section>
        )}

        {stage.care_notes && (
          <section className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold text-lg mb-3">饲养注意事项</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {stage.care_notes}
            </p>
          </section>
        )}

        {stage.common_mistakes && (
          <section className="rounded-lg border bg-destructive/10 p-6">
            <h2 className="font-semibold text-lg mb-3 text-destructive">常见误区</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {stage.common_mistakes}
            </p>
          </section>
        )}

        {(stage.duration_base || stage.duration_note) && (
          <section className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold text-lg mb-3">持续时间</h2>
            {stage.duration_base && (
              <p className="font-medium text-lg">{stage.duration_base}</p>
            )}
            {stage.duration_note && (
              <p className="mt-1 text-sm text-muted-foreground">{stage.duration_note}</p>
            )}
          </section>
        )}

        {stage.tips && (
          <section className="rounded-lg border bg-accent/50 p-6">
            <h2 className="font-semibold text-lg mb-3">小贴士</h2>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {Array.isArray(stage.tips)
                ? (stage.tips as string[]).map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))
                : null}
            </ul>
          </section>
        )}
      </div>

      <div className="mt-8 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center">
        <p className="font-medium">你的蚁群走到这个阶段了吗？</p>
        <p className="mt-1 text-sm text-muted-foreground">
          记录你的观察，让 AI 帮你分析蚁群状态
        </p>
        <Link
          href="/colonies/new"
          className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          去记录 {"->"}
        </Link>
      </div>

      <div className="mt-8 flex justify-between items-center">
        {prevStage ? (
          <Link
            href={`/lifecycle/${prevStage.stage_key}`}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {"<-"} {prevStage.name}
          </Link>
        ) : (
          <span />
        )}

        {nextStage ? (
          <Link
            href={`/lifecycle/${nextStage.stage_key}`}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {nextStage.name} {"->"}
          </Link>
        ) : (
          <Link
            href="/lifecycle"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            返回总览 {"->"}
          </Link>
        )}
      </div>
    </div>
  );
}
