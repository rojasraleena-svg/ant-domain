import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = {
  title: "新建蚁群",
};

export default async function NewColonyPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  // 从数据库加载物种列表
  const { data: speciesList } = await db
    .from("species")
    .select("id, name_cn, name_lat, genus_cn, beginner_friendly")
    .eq("status", 1)
    .order("sort_order", { ascending: true });

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">新建蚁群</h1>
        <p className="mt-1 text-muted-foreground">
          创建你的蚁群档案，开始记录成长过程
        </p>
      </div>

      <form
        action={async (formData) => {
          "use server";
          const user = await getSession();
          if (!user) redirect("/login");

          const name = formData.get("name") as string;
          const speciesId = parseInt(formData.get("speciesId") as string);
          const foundedDate = formData.get("foundedDate") as string;
          const queenCount = parseInt(
            (formData.get("queenCount") as string) || "1"
          );
          const notes = formData.get("notes") as string;

          const { error } = await db.from("colonies").insert({
            user_id: user.id,
            name,
            species_id: speciesId,
            founded_date: foundedDate,
            queen_count: queenCount,
            notes: notes || null,
          });

          if (error) {
            redirect(`/colonies/new?message=${encodeURIComponent(error.message)}`);
          }

          redirect("/colonies");
        }}
        className="space-y-6 rounded-lg border bg-card p-6"
      >
        {/* 蚁群名称 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1.5">
            蚁群名称 *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="如：小黑的日本弓背"
            className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
          />
        </div>

        {/* 物种选择（动态加载） */}
        <div>
          <label htmlFor="speciesId" className="block text-sm font-medium mb-1.5">
            物种 *
          </label>
          <select
            id="speciesId"
            name="speciesId"
            required
            className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
          >
            <option value="">选择物种...</option>
            {(speciesList ?? []).map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.name_cn} - {sp.name_lat}
                {sp.beginner_friendly ? " [新手推荐]" : ""}
                {sp.genus_cn ? ` (${sp.genus_cn})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* 建档日期 */}
        <div>
          <label htmlFor="foundedDate" className="block text-sm font-medium mb-1.5">
            建档日期 *
          </label>
          <input
            id="foundedDate"
            name="foundedDate"
            type="date"
            required
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
          />
        </div>

        {/* 蚁后数量 */}
        <div>
          <label htmlFor="queenCount" className="block text-sm font-medium mb-1.5">
            蚁后数量
          </label>
          <input
            id="queenCount"
            name="queenCount"
            type="number"
            min={1}
            defaultValue={1}
            className="w-full max-w-[200px] rounded-lg border bg-background px-4 py-2 text-sm"
          />
        </div>

        {/* 备注 */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1.5">
            来源备注
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            maxLength={200}
            placeholder="如：2024年7月婚飞采集于北京奥林匹克森林公园"
            className="w-full rounded-lg border bg-background px-4 py-2 text-sm resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-lg bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            创建蚁群
          </button>
          <a
            href="/colonies"
            className="rounded-lg border px-6 py-2 text-sm hover:bg-accent"
          >
            取消
          </a>
        </div>
      </form>
    </div>
  );
}
