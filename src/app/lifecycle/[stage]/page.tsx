import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllLifeStages,
  getLifeStageByKey,
  getLifecycleGenera,
  getStageDiff,
} from "@/lib/public-data";
import { AlertTriangle, ArrowRightLeft, ChevronRight } from "lucide-react";

const genusCnMap: Record<string, string> = {
  Camponotus: "弓背蚁属",
  Polyrhachis: "多刺蚁属",
  Formica: "蚁属",
  Lasius: "毛蚁属",
  Paratrechina: "立毛蚁属",
  Oecophylla: "织叶蚁属",
  Plagiolepis: "矮蚁属",
};

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ stage: string }>;
  searchParams: Promise<{ genus?: string }>;
}) {
  const { stage: key } = await params;
  const sp = await searchParams;
  const { genus = "Camponotus" } = sp;

  try {
    const data = await getLifeStageByKey(key);
    const gn = genusCnMap[genus] || genus;
    return {
      title: `${data.name} - ${gn}生活史`,
      description: `${gn} ${data.name} 阶段详解`,
    };
  } catch {
    return { title: "生活史", description: "蚁域" };
  }
}

interface StagePageProps {
  params: Promise<{ stage: string }>;
  searchParams: Promise<{ genus?: string }>;
}

export default async function LifecycleStagePage({
  params,
  searchParams,
}: StagePageProps) {
  const { stage: key } = await params;
  const sp = await searchParams;
  const { genus: selectedGenus = "Camponotus" } = sp;

  let stage;
  try {
    stage = await getLifeStageByKey(key);
  } catch {
    notFound();
  }

  const [allStages, genera, stageDiff] = await Promise.all([
    getAllLifeStages(),
    getLifecycleGenera(),
    selectedGenus !== "Camponotus"
      ? getStageDiff(key, selectedGenus)
      : Promise.resolve(null),
  ]);

  const genusStages = allStages.filter((s) => s.target_genus === selectedGenus);
  const currentIndex = genusStages.findIndex((s) => s.stage_key === key);
  const prevStage = currentIndex > 0 ? genusStages[currentIndex - 1] : null;
  const nextStage =
    currentIndex < genusStages.length - 1
      ? genusStages[currentIndex + 1]
      : null;
  const currentGenusName =
    genusCnMap[selectedGenus] || selectedGenus;
  const isBaseGenus = selectedGenus === "Camponotus";

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <nav className="text-sm text-muted-foreground mb-6">
        <Link
          href={`/lifecycle?genus=${selectedGenus}`}
          className="hover:text-foreground"
        >
          生活史
        </Link>{" "}
        {"->"} {stage.name}
      </nav>

      <div className="mb-6 flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">当前查看：</span>
        <div className="flex gap-1.5 flex-wrap">
          {genera.map((g) => {
            const isActive = g.genus === selectedGenus;
            return (
              <Link
                key={g.genus}
                href={`/lifecycle/${key}?genus=${g.genus}`}
                className={`px-3 py-1 rounded-full transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {g.name}
              </Link>
            );
          })}
        </div>
      </div>

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
            {currentGenusName}（{selectedGenus}）· 阶段{" "}
            {currentIndex + 1} / {genusStages.length}
            {stage.milestone && (
              <span
                className="ml-2 text-xs px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: stage.color || "#666" }}
              >
                里程碑
              </span>
            )}
            {!isBaseGenus && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                属差异
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {!isBaseGenus && stageDiff && (
          <section className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 p-6">
            <h2 className="font-semibold text-lg mb-3 flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <ArrowRightLeft size={18} />
              {currentGenusName}的差异特点
            </h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              {stageDiff.duration && (
                <div>
                  <span className="font-medium text-foreground">持续时间：</span>
                  <span>{stageDiff.duration}</span>
                </div>
              )}
              {stageDiff.temp_note && (
                <div>
                  <span className="font-medium text-foreground">温度说明：</span>
                  <span>{stageDiff.temp_note}</span>
                </div>
              )}
              {stageDiff.special_notes && (
                <div>
                  <span className="font-medium text-foreground">特别说明：</span>
                  <p className="mt-1 leading-relaxed whitespace-pre-wrap">
                    {stageDiff.special_notes}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

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
            <h2 className="font-semibold text-lg mb-3 text-destructive flex items-center gap-2">
              <AlertTriangle size={16} />
              常见误区
            </h2>
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
              <p className="mt-1 text-sm text-muted-foreground">
                {stage.duration_note}
              </p>
            )}
            {!isBaseGenus && stageDiff?.duration && (
              <p className="mt-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
                {currentGenusName}：{stageDiff.duration}
              </p>
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
          className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          去记录 <ChevronRight size={14} />
        </Link>
      </div>

      <div className="mt-8 flex justify-between items-center">
        {prevStage ? (
          <Link
            href={`/lifecycle/${prevStage.stage_key}?genus=${selectedGenus}`}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {"<-"} {prevStage.name}
          </Link>
        ) : (
          <span />
        )}

        {nextStage ? (
          <Link
            href={`/lifecycle/${nextStage.stage_key}?genus=${selectedGenus}`}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {nextStage.name} {"->"}
          </Link>
        ) : (
          <Link
            href={`/lifecycle?genus=${selectedGenus}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            返回总览 {"->"}
          </Link>
        )}
      </div>
    </div>
  );
}
