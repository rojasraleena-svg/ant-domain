import Link from "next/link";
import { getAllSpecies } from "@/lib/public-data";
import { SpeciesSearch } from "./search-bar";

export const metadata = {
  title: "资料库",
  description: "蚁亚科蚂蚁物种资料库",
};

export default async function SpeciesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const tag = params.tag || "";

  let species;
  if (query) {
    species = await searchSpecies(query);
  } else if (tag) {
    species = await filterSpeciesByTag(tag);
  } else {
    species = await getAllSpecies();
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      {/* 页面头部 */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight page-header-bar title-deco">
          资料库
        </h1>
        <p className="mt-4 text-muted-foreground text-base">
          蚁亚科（Formicinae）物种资料 · 探索蚂蚁的多样性
        </p>
      </div>

      {/* 搜索栏 */}
      <SpeciesSearch defaultValue={query} />

      {/* 筛选标签 */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { label: "全部", tag: "" },
          { label: "新手推荐", tag: "beginner" },
          { label: "无需冬眠", tag: "no-hibernation" },
          { label: "弓背蚁属", tag: "Camponotus" },
          { label: "多刺蚁属", tag: "Polyrhachis" },
        ].map((item) => (
          <Link
            key={item.tag}
            href={item.tag ? `/species?tag=${item.tag}` : "/species"}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 hover:bg-accent ${
              params.tag === item.tag
                ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/15"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* 物种列表 */}
      {species.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <p className="text-muted-foreground font-medium">没有找到匹配的物种</p>
          <p className="mt-1 text-sm text-muted-foreground/60">尝试其他关键词或清除筛选条件</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {species.map((sp, i) => (
            <Link
              key={sp.id}
              href={`/species/${sp.id}`}
              className="group card-hover rounded-2xl border bg-card p-5 sm:p-6 relative overflow-hidden"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* 左上角装饰点 */}
              <div className={`absolute top-5 left-5 w-2 h-2 rounded-full transition-colors duration-300 ${sp.beginner_friendly ? "bg-nature-green" : "bg-primary/50"} group-hover:bg-primary`} />

              <div className="flex items-start justify-between pl-4">
                <div>
                  <h3 className="font-bold group-hover:text-primary transition-colors duration-200 tracking-tight">
                    {sp.name_cn}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5 italic font-light">
                    {sp.name_lat}
                  </p>
                </div>
                {sp.beginner_friendly && (
                  <span className="rounded-full bg-nature-green/10 text-nature-green dark:bg-nature-green/20 dark:text-nature-green/80 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap border border-nature-green/12">
                    新手友好
                  </span>
                )}
              </div>
              {sp.summary && (
                <p className="mt-3 text-sm line-clamp-2 text-muted-foreground leading-relaxed pl-4">
                  {sp.summary}
                </p>
              )}
              <div className="mt-3 pt-3 border-t border-border/40 flex gap-2 flex-wrap text-xs text-muted-foreground pl-4">
                <span>{sp.genus_cn || sp.genus}</span>
                <span className="text-border">·</span>
                <span>{sp.temp_optimal ? `${sp.temp_optimal}°C` : `${sp.temp_min ?? ""}-${sp.temp_max ?? ""}°C`}</span>
                {sp.need_hibernation && (
                  <>
                    <span className="text-border">·</span>
                    <span>需要冬眠</span>
                  </>
                )}
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

  switch (tag) {
    case "beginner":
      query = query.eq("beginner_friendly", true);
      break;
    case "no-hibernation":
      query = query.eq("need_hibernation", false);
      break;
    case "Camponotus":
      query = query.eq("genus", "Camponotus");
      break;
    case "Polyrhachis":
      query = query.eq("genus", "Polyrhachis");
      break;
    default:
      break;
  }

  const { data, error } = await query.order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
