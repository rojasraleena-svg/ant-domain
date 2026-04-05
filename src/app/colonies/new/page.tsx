import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";import { SubmitButton } from "@/app/colonies/components/submit-button";
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

  const { data: speciesList } = await db
    .from("species")
    .select("id, name_cn, name_lat, genus_cn, beginner_friendly")
    .eq("status", 1)
    .order("sort_order", { ascending: true });

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12 sm:py-20 animate-fade-in relative">
      {/* 装饰元素 */}
      <div className="absolute top-20 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-48 h-48 bg-accent-warm/10 rounded-full blur-[60px] pointer-events-none" />

      <div className="mb-12 relative z-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-muted-foreground">
          新建档案
        </h1>
        <p className="text-lg text-muted-foreground/80 font-light tracking-wide">
          初始化微型生态舱，输入目标物种的基础参数。
        </p>
      </div>

      {message && (
        <div className="mb-8 rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive flex items-center justify-center gap-2 animate-shake">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          {message}
        </div>
      )}

      <form
        action={async (formData) => {
          "use server";
          // ... 逻辑保持不变，但为了代码正确我会提取原有处理逻辑出来
          const currentUser = await getSession();
          if (!currentUser) redirect("/login");

          const name = (formData.get("name") as string)?.trim();
          const speciesIdRaw = formData.get("speciesId") as string;
          const foundedDate = formData.get("foundedDate") as string;
          const queenCountRaw = formData.get("queenCount") as string;
          const notes = (formData.get("notes") as string)?.trim();

          if (!name || name.length < 1) {
            return redirect(`/colonies/new?message=${encodeURIComponent("请输入蚁群名称")}`);
          }

          if (name.length > 30) {
            return redirect(`/colonies/new?message=${encodeURIComponent("蚁群名称不能超过 30 个字符")}`);
          }

          const speciesId = parseInt(speciesIdRaw, 10);
          if (!speciesId || Number.isNaN(speciesId)) {
            return redirect(`/colonies/new?message=${encodeURIComponent("请选择一个物种")}`);
          }

          if (!foundedDate) {
            return redirect(`/colonies/new?message=${encodeURIComponent("请选择建档日期")}`);
          }

          const queenCount = Math.max(1, parseInt(queenCountRaw, 10) || 1);
          if (queenCount > 99) {
             return redirect(`/colonies/new?message=${encodeURIComponent("蚁后数量不合理，最大为 99")}`);
          }

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
              if (error.code === "23505" || error.message?.includes("unique")) {
                return redirect(`/colonies/new?message=${encodeURIComponent("该蚁群名称已存在，请换一个名字")}`);
              }
              return redirect(`/colonies/new?message=${encodeURIComponent("创建失败，请稍后重试")}`);
            }
          } catch (error) {
             return redirect(`/colonies/new?message=${encodeURIComponent("创建失败，请稍后重试")}`);
          }

          redirect("/colonies");
        }}
        className="relative z-10 space-y-8 rounded-[2.5rem] border border-white/10 bg-card/20 backdrop-blur-2xl p-8 sm:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

        <div className="relative group">
          <label
            htmlFor="name"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2 group-focus-within:text-primary transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            档案代号
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={30}
            placeholder="为群落命名 (如: 极地星哨站)"
            className="w-full rounded-2xl border-2 border-white/10 bg-black/20 px-6 py-4 text-base md:text-lg focus:border-primary/50 focus:bg-black/40 focus:outline-none transition-all duration-300 placeholder:text-muted-foreground/30 shadow-inner"
          />
        </div>

        <div className="relative group">
          <label
            htmlFor="speciesId"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2 group-focus-within:text-accent-warm transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent-warm" />
            引入物种
          </label>
          <div className="relative">
            <select
              id="speciesId"
              name="speciesId"
              required
              defaultValue=""
              className="w-full rounded-2xl border-2 border-white/10 bg-black/20 px-6 py-4 text-base md:text-lg focus:border-accent-warm/50 focus:bg-black/40 focus:outline-none transition-all duration-300 appearance-none shadow-inner text-foreground/90 disabled:text-muted-foreground/30"
            >
              <option value="" disabled className="bg-background text-muted-foreground">
                — 请选择目标观测物种 —
              </option>
              {(speciesList ?? []).map((sp) => (
                <option key={sp.id} value={sp.id} className="bg-background text-foreground">
                  {sp.name_cn} • {sp.name_lat} {sp.beginner_friendly ? "⭐" : ""}
                </option>
              ))}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/50 border-l border-white/10 pl-4">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                 <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="relative group">
            <label
              htmlFor="foundedDate"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2 group-focus-within:text-primary transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              建立日期
            </label>
            <input
              id="foundedDate"
              name="foundedDate"
              type="date"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full rounded-2xl border-2 border-white/10 bg-black/20 px-6 py-4 text-base focus:border-primary/50 focus:bg-black/40 focus:outline-none transition-all duration-300 shadow-inner block"
              style={{ colorScheme: "dark" }}
            />
          </div>

          <div className="relative group">
            <label
              htmlFor="queenCount"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2 group-focus-within:text-primary transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              核心基数
            </label>
            <div className="relative">
               <input
                 id="queenCount"
                 name="queenCount"
                 type="number"
                 min={1}
                 max={99}
                 defaultValue={1}
                 className="w-full rounded-2xl border-2 border-white/10 bg-black/20 px-6 py-4 text-base focus:border-primary/50 focus:bg-black/40 focus:outline-none transition-all duration-300 shadow-inner pr-16"
               />
               <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/50 pointer-events-none">只</span>
            </div>
          </div>
        </div>

        <div className="relative group">
          <label
            htmlFor="notes"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2 group-focus-within:text-primary transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
            附加注释
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            maxLength={500}
            placeholder="源产地、卖家信息等 (选填)"
            className="w-full rounded-2xl border-2 border-white/10 bg-black/20 px-6 py-4 text-base focus:border-primary/50 focus:bg-black/40 focus:outline-none transition-all duration-300 placeholder:text-muted-foreground/30 shadow-inner resize-y min-h-[120px] custom-scrollbar"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-4 sm:justify-end pt-6 border-t border-white/10">
          <Link
            href="/colonies"
            className="inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-bold text-foreground/70 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-foreground transition-all duration-300"
          >
            取消建档
          </Link>
          <SubmitButton loadingText="协议上传中...">完成建档</SubmitButton>
        </div>
      </form>
    </div>
  );
}
