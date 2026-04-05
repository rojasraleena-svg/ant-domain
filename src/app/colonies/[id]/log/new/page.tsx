import Link from "next/link";
import { redirect } from "next/navigation";
import { summarizeLog } from "@/lib/ai";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = {
  title: "写日志",
};

const EGG_OPTIONS = [
  { value: "", label: "无" },
  { value: "few", label: "少量" },
  { value: "many", label: "较多" },
  { value: "abundant", label: "很多" },
];

const ABNORMAL_TYPES = [
  { value: "", label: "正常" },
  { value: "death", label: "死亡" },
  { value: "escape", label: "逃逸" },
  { value: "disease", label: "病害/异常" },
  { value: "other", label: "其他异常" },
];

export default async function NewLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { id } = await params;

  const { data: colony, error: colonyError } = await db
    .from("colonies")
    .select("*, species(name_cn, name_lat)")
    .eq("id", parseInt(id, 10))
    .eq("user_id", user.id)
    .single();

  if (colonyError || !colony) redirect("/colonies");

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/colonies" className="hover:text-foreground">
          我的蚁群
        </Link>{" "}
        {"->"}{" "}
        <Link href={`/colonies/${id}`} className="hover:text-foreground">
          {colony.name}
        </Link>{" "}
        {"->"} 写日志
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">记录观察</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {colony.species?.name_cn} · {colony.name}
        </p>
      </div>

      <form
        action={async (formData) => {
          "use server";

          const currentUser = await getSession();
          if (!currentUser) redirect("/login");

          const title = formData.get("title") as string;
          const content = formData.get("content") as string;
          const stage = formData.get("stage") as string;
          const workerCount = formData.get("workerCount") as string;
          const eggStatus = formData.get("eggStatus") as string;
          const larvaStatus = formData.get("larvaStatus") as string;
          const pupaStatus = formData.get("pupaStatus") as string;
          const feedingRecord = formData.get("feedingRecord") as string;
          const temperature = formData.get("temperature")
            ? parseFloat(formData.get("temperature") as string)
            : null;
          const humidity = formData.get("humidity")
            ? parseFloat(formData.get("humidity") as string)
            : null;
          const abnormalType = formData.get("abnormalType") as string;

          const { error: logError } = await db.from("colony_logs").insert({
            colony_id: parseInt(id, 10),
            user_id: currentUser.id,
            date: new Date().toISOString(),
            title,
            content: content || null,
            stage: stage || null,
            worker_count: workerCount || null,
            egg_status: eggStatus || null,
            larva_status: larvaStatus || null,
            pupa_status: pupaStatus || null,
            feeding_record: feedingRecord || null,
            temperature,
            humidity,
            abnormal_type: abnormalType || null,
          });

          if (logError) {
            console.error("写入日志失败:", logError);
            return redirect(
              `/colonies/${id}?error=${encodeURIComponent("保存失败，请稍后重试")}`
            );
          }

          const { data: newLog } = await db
            .from("colony_logs")
            .select("id")
            .eq("colony_id", parseInt(id, 10))
            .eq("title", title)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          try {
            const aiResult = await summarizeLog({
              colonyName: colony.name,
              speciesName: colony.species?.name_cn || "",
              currentStage: colony.current_stage || undefined,
              title,
              content: content || "",
              workerCount: workerCount || undefined,
              eggStatus: eggStatus || undefined,
              larvaStatus: larvaStatus || undefined,
              pupaStatus: pupaStatus || undefined,
              feedingRecord: feedingRecord || undefined,
              temperature: temperature ?? undefined,
              humidity: humidity ?? undefined,
              abnormalType: abnormalType || undefined,
            });

            if (newLog) {
              await db
                .from("colony_logs")
                .update({
                  ai_summary: aiResult.summary,
                  event_type: aiResult.inferredStage || undefined,
                })
                .eq("id", newLog.id);
            }

            if (
              aiResult.inferredStage &&
              aiResult.inferredStage !== colony.current_stage
            ) {
              await db
                .from("colonies")
                .update({ current_stage: aiResult.inferredStage })
                .eq("id", parseInt(id, 10));
            }
          } catch (aiError) {
            console.error("AI 摘要生成失败:", aiError);
          }

          redirect(`/colonies/${id}`);
        }}
        className="space-y-5 rounded-lg border bg-card p-6"
      >
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1.5">
            今天观察到什么？ *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="一句话概括今天的观察"
            className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-1.5">
            详细记录
          </label>
          <textarea
            id="content"
            name="content"
            rows={4}
            maxLength={2000}
            placeholder="详细描述你观察到的内容..."
            className="w-full rounded-lg border bg-background px-4 py-2 text-sm resize-none"
          />
        </div>

        <div>
          <label htmlFor="stage" className="block text-sm font-medium mb-1.5">
            当前阶段
          </label>
          <select
            id="stage"
            name="stage"
            className="w-full max-w-xs rounded-lg border bg-background px-4 py-2 text-sm"
          >
            <option value="">不确定</option>
            <option value="nesting">建巢 / 创群</option>
            <option value="egg">卵期</option>
            <option value="larva">幼虫期</option>
            <option value="pupa">蛹期</option>
            <option value="first_workers">首批工蚁羽化</option>
            <option value="early_growth">初级扩群</option>
            <option value="steady_growth">稳定增长</option>
            <option value="mature">成熟群体</option>
            <option value="hibernation">冬眠</option>
          </select>
        </div>

        <fieldset className="rounded-lg border p-4">
          <legend className="text-sm font-medium mb-3">幼体状态</legend>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1">卵</label>
              <select
                name="eggStatus"
                className="w-full rounded border bg-background px-2 py-1.5 text-sm"
              >
                {EGG_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1">幼虫</label>
              <select
                name="larvaStatus"
                className="w-full rounded border bg-background px-2 py-1.5 text-sm"
              >
                {EGG_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1">蛹</label>
              <select
                name="pupaStatus"
                className="w-full rounded border bg-background px-2 py-1.5 text-sm"
              >
                {EGG_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="feedingRecord"
              className="block text-sm font-medium mb-1.5"
            >
              喂食记录
            </label>
            <input
              id="feedingRecord"
              name="feedingRecord"
              type="text"
              placeholder="如：糖水 + 果蝇"
              className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="temperature"
                className="block text-xs text-muted-foreground mb-1"
              >
                温度 °C
              </label>
              <input
                id="temperature"
                name="temperature"
                type="number"
                step="0.1"
                placeholder="25"
                className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="humidity"
                className="block text-xs text-muted-foreground mb-1"
              >
                湿度 %
              </label>
              <input
                id="humidity"
                name="humidity"
                type="number"
                placeholder="65"
                className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">异常情况</label>
          <select
            name="abnormalType"
            className="w-full max-w-xs rounded-lg border bg-background px-4 py-2 text-sm"
          >
            {ABNORMAL_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-lg bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            保存日志 + AI 分析
          </button>
          <Link
            href={`/colonies/${id}`}
            className="rounded-lg border px-6 py-2 text-sm hover:bg-accent"
          >
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
