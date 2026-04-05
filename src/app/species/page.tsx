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

  let species;
  if (query) {
    species = await searchSpecies(query);
  } else {
    species = await getAllSpecies();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">资料库</h1>
        <p className="mt-2 text-muted-foreground">
          蚁亚科（Formicinae）物种资料 · MVP 阶段
        </p>
      </div>

      {/* 搜索栏 */}
      <SpeciesSearch defaultValue={query} />

      {/* 筛选标签 */}
      <div className="flex flex-wrap gap-2 mb-6">
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
            className={`rounded-full border px-3 py-1 text-sm transition-colors hover:bg-accent ${
              params.tag === item.tag
                ? "bg-primary text-primary-foreground border-primary"
                : ""
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* 物种列表 */}
      {species.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>没有找到匹配的物种</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {species.map((sp) => (
            <Link
              key={sp.id}
              href={`/species/${sp.id}`}
              className="group rounded-lg border bg-card p-5 transition-colors hover:bg-accent"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {sp.name_cn}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5 italic">
                    {sp.name_lat}
                  </p>
                </div>
                {sp.beginner_friendly && (
                  <span className="rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 text-xs whitespace-nowrap">
                    新手友好
                  </span>
                )}
              </div>
              {sp.summary && (
                <p className="mt-2 text-sm line-clamp-2 text-muted-foreground">
                  {sp.summary}
                </p>
              )}
              <div className="mt-3 flex gap-2 flex-wrap text-xs text-muted-foreground">
                <span>{sp.genus_cn || sp.genus}</span>
                <span>·</span>
                <span>{sp.temp_optimal ? `${sp.temp_optimal}°C` : `${sp.temp_min ?? ""}-${sp.temp_max ?? ""}°C`}</span>
                {sp.need_hibernation && (
                  <>
                    <span>·</span>
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

// 服务端搜索函数（供页面使用）
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
