import Link from "next/link";
import { redirect } from "next/navigation";
import { summarizeLog } from "@/lib/ai";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { SubmitButton } from "@/app/colonies/components/submit-button";

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
    <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-16 animate-fade-in relative">
      {/* 装饰元素 */}
      <div className="absolute top-10 right-10 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
      
      <nav className="text-xs font-medium tracking-widest text-muted-foreground/60 mb-10 flex flex-wrap items-center gap-2 uppercase relative z-10 w-full max-w-full truncate overflow-hidden">
        <Link href="/colonies" className="hover:text-primary transition-colors focus-ring shrink-0">
          阵列
        </Link>
        <span className="text-border/40 shrink-0">/</span>
        <Link href={`/colonies/${id}`} className="hover:text-primary transition-colors focus-ring truncate max-w-[120px] sm:max-w-xs">
          {colony.name}
        </Link>
        <span className="text-border/40 shrink-0">/</span>
        <span className="text-foreground/80 flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-slow"></span>
          日志记录
        </span>
      </nav>

      <div className="mb-12 relative z-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-muted-foreground">
          观测归档
        </h1>
        <p className="text-lg text-muted-foreground/80 font-light tracking-wide max-w-md mx-auto">
          记录 {colony.species?.name_cn} 群落的关键动态，系统将自动生成 AI 维度分析。
        </p>
      </div>

      <form
        action={async (formData) => {
          "use server";
          // ... 提取逻辑
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
          const temperature = formData.get("temperature") ? parseFloat(formData.get("temperature") as string) : null;
          const humidity = formData.get("humidity") ? parseFloat(formData.get("humidity") as string) : null;
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
            return redirect(`/colonies/${id}?error=${encodeURIComponent("保存失败，请稍后重试")}`);
          }

          const { data: newLog } = await db.from("colony_logs").select("id").eq("colony_id", parseInt(id, 10)).eq("title", title).order("created_at", { ascending: false }).limit(1).single();

          try {
            const aiResult = await summarizeLog({
              colonyName: colony.name,
              speciesName: colony.species?.name_cn || "",
              currentStage: colony.current_stage || undefined,
              title, content: content || "", workerCount: workerCount || undefined, eggStatus: eggStatus || undefined, larvaStatus: larvaStatus || undefined, pupaStatus: pupaStatus || undefined, feedingRecord: feedingRecord || undefined, temperature: temperature ?? undefined, humidity: humidity ?? undefined, abnormalType: abnormalType || undefined,
            });

            if (newLog) {
              await db.from("colony_logs").update({ ai_summary: aiResult.summary, event_type: aiResult.inferredStage || undefined }).eq("id", newLog.id);
            }
            if (aiResult.inferredStage && aiResult.inferredStage !== colony.current_stage) {
              await db.from("colonies").update({ current_stage: aiResult.inferredStage }).eq("id", parseInt(id, 10));
            }
          } catch (aiError) {}

          redirect(`/colonies/${id}`);
        }}
        className="relative z-10 space-y-10 rounded-[2.5rem] border border-white/10 bg-card/20 backdrop-blur-2xl p-6 sm:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

        {/* --- 主旨部分 --- */}
        <div className="relative group">
           <label htmlFor="title" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2 group-focus-within:text-primary transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" /> 事件主旨 / Target Event
           </label>
           <input
             id="title" name="title" type="text" required placeholder="如：首批工蚁羽化"
             className="w-full rounded-2xl border-2 border-white/10 bg-black/20 px-6 py-4 text-base md:text-lg focus:border-primary/50 focus:bg-black/40 focus:outline-none transition-all shadow-inner placeholder:text-muted-foreground/30"
           />
        </div>

        {/* --- 详情部分 --- */}
        <div className="relative group">
           <label htmlFor="content" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2 group-focus-within:text-primary transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-white/30 group-focus-within:bg-primary/50" /> 详细观测参数 / Observations
           </label>
           <textarea
             id="content" name="content" rows={4} maxLength={2000} placeholder="详细描述你观察到的全过程，AI将以此为基准进行演化推演。"
             className="w-full rounded-2xl border-2 border-white/10 bg-black/20 px-6 py-4 text-base focus:border-primary/50 focus:bg-black/40 focus:outline-none transition-all shadow-inner placeholder:text-muted-foreground/30 resize-y min-h-[140px] custom-scrollbar"
           />
        </div>

        {/* --- 发育阶段 --- */}
        <div className="relative group border-t border-white/10 pt-8 mt-8">
           <label htmlFor="stage" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-4 group-focus-within:text-accent-warm transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-warm" /> 演化阶段 / Stage
           </label>
           <div className="relative">
             <select id="stage" name="stage" className="w-full sm:w-1/2 rounded-2xl border-2 border-white/10 bg-black/20 px-6 py-4 text-base focus:border-accent-warm/50 focus:bg-black/40 focus:outline-none transition-all shadow-inner appearance-none text-foreground/90">
                <option value="" className="bg-background">保持现状或由AI推演</option>
                <option value="nesting" className="bg-background">建巢 / 创群</option>
                <option value="egg" className="bg-background">卵期</option>
                <option value="larva" className="bg-background">幼虫期</option>
                <option value="pupa" className="bg-background">蛹期</option>
                <option value="first_workers" className="bg-background">首批工蚁羽化</option>
                <option value="early_growth" className="bg-background">初级扩群</option>
                <option value="steady_growth" className="bg-background">稳定增长</option>
                <option value="mature" className="bg-background">成熟群体</option>
                <option value="hibernation" className="bg-background">冬眠状态</option>
             </select>
             <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/50 sm:left-[calc(50%-3rem)] sm:right-auto">
               <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
             </div>
           </div>
        </div>

        {/* --- 细节指标 (Bento Box) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/10 rounded-3xl p-6 border border-white/5">
           
           {/* 幼体存量 */}
           <fieldset className="flex flex-col gap-4">
             <legend className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-2">幼体存量检测 (Brood)</legend>
             <div className="grid grid-cols-3 gap-3">
               <div>
                  <label className="text-xs text-muted-foreground/70 mb-1.5 block">卵 (Eggs)</label>
                  <select name="eggStatus" className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-foreground/90 appearance-none text-center">
                    {EGG_OPTIONS.map(opt => <option key={opt.value} value={opt.value} className="bg-background truncate">{opt.label}</option>)}
                  </select>
               </div>
               <div>
                  <label className="text-xs text-muted-foreground/70 mb-1.5 block">幼虫 (Larvae)</label>
                  <select name="larvaStatus" className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-foreground/90 appearance-none text-center">
                    {EGG_OPTIONS.map(opt => <option key={opt.value} value={opt.value} className="bg-background truncate">{opt.label}</option>)}
                  </select>
               </div>
               <div>
                  <label className="text-xs text-muted-foreground/70 mb-1.5 block">蛹 (Pupae)</label>
                  <select name="pupaStatus" className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-foreground/90 appearance-none text-center">
                    {EGG_OPTIONS.map(opt => <option key={opt.value} value={opt.value} className="bg-background truncate">{opt.label}</option>)}
                  </select>
               </div>
             </div>
           </fieldset>
           
           {/* 环境与补给 */}
           <fieldset className="flex flex-col gap-4">
             <legend className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-2">环境与补给 (Env & Feed)</legend>
             <div className="grid grid-cols-2 gap-3 mb-3">
               <div className="relative">
                 <label htmlFor="temperature" className="text-xs text-muted-foreground/70 mb-1.5 block">温度 / °C</label>
                 <input id="temperature" name="temperature" type="number" step="0.1" placeholder="N/A" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/30 focus:border-primary/50 text-center transition-all" />
               </div>
               <div className="relative">
                 <label htmlFor="humidity" className="text-xs text-muted-foreground/70 mb-1.5 block">湿度 / %</label>
                 <input id="humidity" name="humidity" type="number" placeholder="N/A" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/30 focus:border-primary/50 text-center transition-all" />
               </div>
             </div>
             <div>
                <input id="feedingRecord" name="feedingRecord" type="text" placeholder="输入补给物资如: 蜜水、果蝇..." className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/30 focus:border-primary/50 transition-all" />
             </div>
           </fieldset>

        </div>

        {/* --- 异常检测 --- */}
        <div className="relative group border-t border-white/10 pt-8">
           <label htmlFor="abnormalType" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-4 group-focus-within:text-destructive transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive" /> 异常检测 / Alerts
           </label>
           <div className="relative">
              <select name="abnormalType" id="abnormalType" className="w-full sm:w-1/2 rounded-2xl border-2 border-white/10 bg-black/20 px-6 py-4 text-base focus:border-destructive/50 focus:bg-destructive/10 focus:outline-none transition-all shadow-inner appearance-none text-foreground/90">
                 {ABNORMAL_TYPES.map((opt) => (
                   <option key={opt.value} value={opt.value} className="bg-background text-foreground shrink-0 truncate">
                      {opt.label === "正常" ? "一切正常 (Nominal)" : opt.label}
                   </option>
                 ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/50 sm:left-[calc(50%-3rem)] sm:right-auto">
                 <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
              </div>
           </div>
        </div>

        {/* --- 提交区域 --- */}
        <div className="flex flex-col-reverse sm:flex-row gap-4 sm:justify-end pt-6 border-t border-white/10 mt-10">
          <Link
            href={`/colonies/${id}`}
            className="inline-flex items-center justify-center rounded-2xl px-8 py-4 text-sm font-bold text-foreground/70 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-foreground transition-all duration-300 shadow-sm"
          >
            终止归档
          </Link>
          <SubmitButton loadingText="中枢分析中..." className="px-8 py-4 text-base shadow-[0_0_20px_rgba(255,100,50,0.15)] group relative overflow-hidden">
            <span className="relative z-10 inline-flex items-center gap-2">
               上传并启动 AI 分析
               <svg className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
            </span>
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
