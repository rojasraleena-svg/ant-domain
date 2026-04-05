import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = {
  title: "新建蚁群",
};

export default async function NewColonyPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { message } = await searchParams;

  // 从数据库加载物种列表
  const { data: speciesList } = await db
    .from("species")
    .select("id, name_cn, name_lat, genus_cn, beginner_friendly")
    .eq("status", 1)
    .order("sort_order", { ascending: true });

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* 页面头部 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight page-header-bar title-deco">
          新建蚁群
        </h1>
        <p className="mt-3 text-muted-foreground">
          创建你的蚁群档案，开始记录成长过程
        </p>
      </div>

      {/* 错误/提示消息 */}
      {message && (
        <div className="mb-6 rounded-xl bg-destructive/8 border border-destructive/20 p-4 text-sm text-destructive">
          {message}
        </div>
      )}

      <form
        action={async (formData) => {
          "use server";

          // 二次验证登录状态
          const currentUser = await getSession();
          if (!user || !currentUser) redirect("/login");

          const name = (formData.get("name") as string)?.trim();
          const speciesIdRaw = formData.get("speciesId") as string;
          const foundedDate = formData.get("foundedDate") as string;
          const queenCountRaw = formData.get("queenCount") as string;
          const notes = (formData.get("notes") as string)?.trim();

          // === 前端验证 ===
          if (!name || name.length < 1) {
            return redirect(
              `/colonies/new?message=${encodeURIComponent("请输入蚁群名称")}`
            );
          }
          if (name.length > 30) {
            return redirect(
              `/colonies/new?message=${encodeURIComponent("蚁群名称不能超过30个字符")}`
            );
          }

          const speciesId = parseInt(speciesIdRaw);
          if (!speciesId || isNaN(speciesId)) {
            return redirect(
              `/colonies/new?message=${encodeURIComponent("请选择一个物种")}`
            );
          }

          if (!foundedDate) {
            return redirect(
              `/colonies/new?message=${encodeURIComponent("请选择建档日期")}`
            );
          }

          const queenCount = Math.max(1, parseInt(queenCountRaw) || 1);
          if (queenCount > 99) {
            return redirect(
              `/colonies/new?message=${encodeURIComponent("蚁后数量不合理（最大99）")}`
            );
          }

          // === 写入数据库 ===
          try {
            const { error } = await db.from("colonies").insert({
              user_id: currentUser.id,
              name,
              species_id: speciesId,
              founded_date: foundedDate,
              queen_count: queenCount,
              notes: notes || null,
            });

            if (error) {
              console.error("创建蚁群失败:", error);
              // 唯一约束冲突等
              if (
                error.code === "23505" ||
                error.message?.includes("unique")
              ) {
                return redirect(
                  `/colonies/new?message=${encodeURIComponent("该蚁群名称已存在，请换一个名字")}`
                );
              }
              return redirect(
                `/colonies/new?message=${encodeURIComponent("创建失败，请稍后重试")}`
              );
            }
          } catch (err) {
            console.error("创建蚁群异常:", err);
            return redirect(
              `/colonies/new?message=${encodeURIComponent("创建失败，请稍后重试")}`
            );
          }

          redirect("/colonies");
        }}
        className="space-y-6 rounded-2xl border bg-card p-6 sm:p-8 shadow-sm"
      >
        {/* 蚁群名称 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1.5 text-foreground/80">
            蚁群名称 <span className="text-destructive">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={30}
            placeholder="如：小黑的日本弓背"
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm input-glow transition-all duration-200"
          />
        </div>

        {/* 物种选择 */}
        <div>
          <label htmlFor="speciesId" className="block text-sm font-medium mb-1.5 text-foreground/80">
            物种 <span className="text-destructive">*</span>
          </label>
          <select
            id="speciesId"
            name="speciesId"
            required
            defaultValue=""
            className="w-full max-w-full rounded-xl border bg-background px-4 py-2.5 text-sm input-glow transition-all duration-200 appearance-none bg-no-repeat bg-right-[12px] bg-[length:var(--arrow-bg)]"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5l2.5 2.5L8 3.5' stroke='%239ca3af' fill='none' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")` }}
          >
            <option value="" disabled>
              选择物种...
            </option>
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
          <label htmlFor="foundedDate" className="block text-sm font-medium mb-1.5 text-foreground/80">
            建档日期 <span className="text-destructive">*</span>
          </label>
          <input
            id="foundedDate"
            name="foundedDate"
            type="date"
            required
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full max-w-xs rounded-xl border bg-background px-4 py-2.5 text-sm input-glow transition-all duration-200"
          />
        </div>

        {/* 蚁后数量 */}
        <div>
          <label htmlFor="queenCount" className="block text-sm font-medium mb-1.5 text-foreground/80">
            蚁后数量
          </label>
          <input
            id="queenCount"
            name="queenCount"
            type="number"
            min={1}
            max={99}
            defaultValue={1}
            className="w-full max-w-[180px] rounded-xl border bg-background px-4 py-2.5 text-sm input-glow transition-all duration-200"
          />
        </div>

        {/* 备注 */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1.5 text-foreground/80">
            来源备注
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            maxLength={200}
            placeholder="如：2024年7月婚飞采集于北京奥林匹克森林公园"
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm resize-none input-glow transition-all duration-200"
          />
        </div>

        {/* 提交按钮 */}
        <div className="flex gap-3 pt-3">
          <button
            type="submit"
            className="rounded-xl bg-primary px-7 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/15 hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
          >
            创建蚁群
          </button>
          <a
            href="/colonies"
            className="rounded-xl border px-7 py-2.5 text-sm font-medium hover:bg-accent transition-colors duration-200 inline-flex items-center"
          >
            取消
          </a>
        </div>
      </form>
    </div>
  );
}
