import Link from "next/link";
import { getAllSpecies, getSpeciesStats } from "@/lib/public-data";
import { SpeciesSearch } from "./search-bar";
import { GalleryLink } from "@/components/gallery-link";

export const metadata = {
  title: "资料库",
  description: "蚁域蚂蚁物种资料库",
};

export default async function SpeciesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const { q: query, tag } = await searchParams;

  let species;
  if (query) {
    species = await searchSpecies(query);
  } else if (tag) {
    species = await filterSpeciesByTag(tag);
  } else {
    species = await getAllSpecies();
  }

  // 获取统计信息
  const stats = await getSpeciesStats();

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 relative">
      {/* 装饰性背景光晕 */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none -z-10" />

      {/* 页面头部 */}
      <div className="mb-16 mt-8 sm:mb-20 text-center flex flex-col items-center">
        <h1 className="text-6xl sm:text-8xl font-black tracking-tighter text-foreground/90 mix-blend-overlay">
          物种<span className="text-primary/70">资料库</span>
        </h1>
        <p className="mt-6 text-xl sm:text-2xl text-muted-foreground font-light tracking-wide max-w-2xl">
          数字显微镜下的微观帝国 · 探索蚂蚁的生境与演化
        </p>
      </div>

      {/* 类群统计卡片 */}
      <section className="mb-12 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {/* 总计 */}
        <div className="flex flex-col items-center justify-center h-full rounded-2xl border border-white/5 bg-card/30 backdrop-blur-xl p-6 text-center shadow-2xl transition-transform hover:-translate-y-1 duration-500 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <p className="text-5xl font-black text-primary/80 drop-shadow-md tracking-tighter">{stats.total}</p>
          <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase mt-2">物种总数</p>
          {stats.totalBeginner > 0 && (
            <div className="mt-4">
              <span className="inline-block rounded-full bg-nature-green/10 px-3 py-1 text-xs font-semibold text-nature-green ring-1 ring-nature-green/20">
                {stats.totalBeginner} 种新手友好
              </span>
            </div>
          )}
        </div>

        {/* 各亚科 */}
        {Object.entries(stats.bySubfamily).map(([sf, info]) => (
          <div key={sf} className="rounded-2xl border border-white/5 bg-card/30 backdrop-blur-xl p-6 shadow-lg transition-transform hover:-translate-y-1 duration-500 group relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="font-bold text-lg tracking-tight text-foreground/90">{info.cn}</h3>
              <p className="text-xs text-muted-foreground/70 uppercase tracking-widest mt-1 mb-5">{sf}</p>
              <div className="flex flex-wrap gap-2 mt-auto">
                {info.genera.map((g) => (
                  <span key={g.genus} className="inline-flex items-center rounded-md bg-muted/40 backdrop-blur-sm border border-white/5 px-2.5 py-1 text-[11px] font-medium text-foreground/80 hover:bg-muted/60 transition-colors cursor-default">
                    {g.cn} <span className="text-muted-foreground/50 ml-1.5">{g.count}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* 搜索栏 */}
      <div className="relative z-20 mb-8 max-w-3xl mx-auto transform -translate-y-4">
        <SpeciesSearch defaultValue={query} />
      </div>

      {/* 筛选标签 */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-10 max-w-5xl mx-auto">
        {[
          { label: "全域观察", tag: "" },
          { label: "新手指南", tag: "beginner" },
          { label: "无休眠", tag: "no-hibernation" },
        ].map((item) => (
          <Link
            key={item.tag}
            href={item.tag ? `/species?tag=${item.tag}` : "/species"}
            className={`rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 hover:-translate-y-0.5 ${
              tag === item.tag
                ? "bg-primary/20 text-primary border-primary shadow-[0_0_15px_rgba(255,100,50,0.15)] backdrop-blur-md"
                : "border-white/5 bg-card/20 text-muted-foreground/60 hover:text-foreground hover:bg-card/40 backdrop-blur-sm"
            }`}
          >
            {item.label}
          </Link>
        ))}

        {/* 亚科分隔 */}
        <span className="mx-2 self-center text-border/20 h-4 w-px bg-white/10" aria-hidden />

        {[
          { label: "蚁亚科", tag: "Formicinae", sub: true },
          { label: "切叶蚁亚科", tag: "Myrmicinae", sub: true },
        ].map((item) => (
          <Link
            key={item.tag}
            href={`/species?tag=${item.tag}`}
            className={`rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all duration-300 hover:-translate-y-0.5 ${
              tag === item.tag
                ? "bg-accent-warm/20 text-accent-warm border-accent-warm/50 shadow-inner backdrop-blur-md"
                : "border-white/5 bg-card/10 text-muted-foreground/50 hover:text-foreground hover:bg-card/30 backdrop-blur-sm"
            }`}
          >
            {item.label}
          </Link>
        ))}

        {/* 属级快捷筛选 */}
        <span className="mx-2 self-center text-border/20 h-4 w-px bg-white/10 hidden sm:block" aria-hidden />
        <div className="flex flex-wrap justify-center gap-1.5 flex-1 w-full sm:w-auto mt-2 sm:mt-0">
          {[
            { label: "弓背蚁", tag: "Camponotus" },
            { label: "大头蚁", tag: "Pheidole" },
            { label: "铺道蚁", tag: "Tetramorium" },
            { label: "举腹蚁", tag: "Crematogaster" },
            { label: "收获蚁", tag: "Messor" },
            { label: "火蚁", tag: "Solenopsis" },
            { label: "毛蚁", tag: "Lasius" },
          ].map((item) => (
            <Link
              key={item.tag}
              href={`/species?tag=${item.tag}`}
              className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                tag === item.tag
                  ? "bg-primary/10 text-primary border-primary/40 shadow-sm"
                  : "border-transparent text-muted-foreground/40 hover:text-foreground/80 hover:bg-white/5"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* 物种列表 */}
      {species.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-white/5 bg-card/10 backdrop-blur-md mt-10">
          <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-5 ring-1 ring-white/5 shadow-inner">
            <svg className="w-8 h-8 text-muted-foreground/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <p className="text-foreground/80 font-medium text-lg tracking-wide">未观测到生命迹象</p>
          <p className="mt-2 text-sm text-muted-foreground/60">尝试其他检索坐标或放宽筛选条件</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:gap-8 pt-8">
          {species.map((sp, i) => (
            <Link
              key={sp.id}
              href={`/species/${sp.id}`}
              className="group block relative overflow-hidden rounded-3xl border border-white/5 bg-card/20 backdrop-blur-xl p-6 sm:p-7 shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-primary/20 hover:bg-card/40"
              style={{ animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 40}ms both` }}
            >
              {/* 卡片高光扫过效果 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[150%] skew-x-[-30deg] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />

              {/* 左上角指示灯 */}
              <div className={`absolute top-6 left-6 w-1.5 h-1.5 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(0,0,0,0.5)] ${sp.beginner_friendly ? "bg-nature-green shadow-nature-green/50" : "bg-primary/50 shadow-primary/30"} group-hover:scale-150`} />

              <div className="flex flex-col h-full pl-6 relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-foreground/90 group-hover:text-primary transition-colors duration-300 tracking-tight">
                      {sp.name_cn}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground/60 mt-1 italic font-light tracking-wide">
                      {sp.name_lat}
                    </p>
                  </div>
                  {sp.beginner_friendly && (
                    <span className="rounded-full bg-nature-green/10 text-nature-green ring-1 ring-nature-green/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shadow-inner flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-nature-green animate-pulse" />
                      新手推荐
                    </span>
                  )}
                </div>
                
                {sp.summary ? (
                  <p className="text-sm line-clamp-3 text-muted-foreground/80 leading-relaxed font-light mt-2 mb-6 flex-grow">
                    {sp.summary}
                  </p>
                ) : (
                  <div className="flex-grow mb-6 pt-2">
                     <div className="w-12 h-0.5 bg-muted-foreground/20 rounded-full" />
                  </div>
                )}
                
                <div className="pt-4 border-t border-white/5 flex gap-2 flex-wrap text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mt-auto">
                  <span className="bg-background/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/5 hover:text-foreground transition-colors">{sp.subfamily_cn || sp.subfamily}</span>
                  <span className="bg-background/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/5 hover:text-foreground transition-colors">{sp.genus_cn || sp.genus}</span>
                  <span className="bg-background/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/5 hover:text-foreground transition-colors text-primary/70">
                    {sp.temp_optimal ? `${sp.temp_optimal}°C` : `${sp.temp_min ?? ""}-${sp.temp_max ?? ""}°C`}
                  </span>
                  {sp.need_hibernation && (
                    <span className="bg-background/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/5 hover:text-foreground transition-colors text-accent-warm">
                      需要冬眠
                    </span>
                  )}
                  <GalleryLink speciesId={sp.id} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

async function searchSpecies(query: string) {
  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await db
    .from("species")
    .select("*")
    .eq("status", 1)
    .or(`name_cn.ilike.%${query}%,name_lat.ilike.%${query}%,genus.ilike.%${query}%`)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function filterSpeciesByTag(tag: string) {
  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let query = db.from("species").select("*").eq("status", 1);

  if (tag === "beginner") {
    query = query.eq("beginner_friendly", true);
  } else if (tag === "no-hibernation") {
    query = query.eq("need_hibernation", false);
  } else if (tag === "Formicinae" || tag === "Myrmicinae") {
    query = query.eq("subfamily", tag);
  } else if (["Camponotus","Pheidole","Tetramorium","Crematogaster","Messor","Monomorium","Solenopsis","Aphaenogaster","Meranoplus","Temnothorax","Strumigenys","Polyrhachis","Lasius","Formica","Paratrechina"].includes(tag)) {
    query = query.eq("genus", tag);
  }

  const { data, error } = await query.order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
