import { createClient } from "@supabase/supabase-js";

// 公开数据读取（不需要认证，用于资料库、生活史等公开页面）
const publicDb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 获取所有启用的物种
export async function getAllSpecies() {
  const { data, error } = await publicDb
    .from("species")
    .select("*")
    .eq("status", 1)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data;
}

// 搜索物种
export async function searchSpecies(query: string) {
  const { data, error } = await publicDb
    .from("species")
    .select("*")
    .eq("status", 1)
    .or(`name_cn.ilike.%${query}%,name_lat.ilike.%${query}%,genus.ilike.%${query}%`)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data;
}

// 获取单个物种详情
export async function getSpeciesById(id: number) {
  const { data, error } = await publicDb
    .from("species")
    .select("*")
    .eq("id", id)
    .eq("status", 1)
    .single();

  if (error) throw error;
  return data;
}

// 获取所有生活史阶段
export async function getAllLifeStages() {
  const { data, error } = await publicDb
    .from("life_stages")
    .select("*")
    .order("order_index", { ascending: true });

  if (error) throw error;
  return data;
}

// 获取单个生活史阶段
export async function getLifeStageByKey(key: string) {
  const { data, error } = await publicDb
    .from("life_stages")
    .select("*")
    .eq("stage_key", key)
    .single();

  if (error) throw error;
  return data;
}

// 获取物种的标本图片列表
export async function getSpecimenImages(speciesId: number) {
  const { data, error } = await publicDb
    .from("specimen_images")
    .select("*")
    .eq("species_id", speciesId)
    .eq("status", 1)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// 获取物种的主图（单张）
export async function getPrimarySpecimenImage(speciesId: number) {
  const { data, error } = await publicDb
    .from("specimen_images")
    .select("*")
    .eq("species_id", speciesId)
    .eq("is_primary", true)
    .eq("status", 1)
    .single();

  // 没有主图时返回 null，不算错误
  if (error && error.code === "PGRST116") return null;
  if (error) throw error;
  return data;
}

const GENUS_CN_MAP: Record<string, string> = {
  Camponotus: "弓背蚁属",
  Polyrhachis: "多刺蚁属",
  Formica: "蚁属",
  Lasius: "毛蚁属",
  Paratrechina: "立毛蚁属",
  Oecophylla: "织叶蚁属",
  Plagiolepis: "矮蚁属",
  // 切叶蚁亚科新增
  Pheidole: "大头蚁属",
  Tetramorium: "铺道蚁属",
  Crematogaster: "举腹蚁属",
  Messor: "收获蚁属",
  Monomorium: "小家蚁属",
  Solenopsis: "火蚁属",
  Aphaenogaster: "盘腹蚁属",
  Meranoplus: "滑胸蚁属",
  Temnothorax: "瘦蚁属",
  Strumigenys: "颚蚁属",
};

const SUBFAMILY_CN_MAP: Record<string, string> = {
  Formicinae: "蚁亚科",
  Myrmicinae: "切叶蚁亚科",
};

export function getGenusCnName(genus: string): string {
  return GENUS_CN_MAP[genus] || genus;
}

// 获取所有支持生活史的属列表（基准属 + 有差异数据的属）
export async function getLifecycleGenera() {
  const { data: diffs, error } = await publicDb
    .from("stage_species_diffs")
    .select("genus");

  if (error) throw error;

  const genusSet = new Set<string>();
  genusSet.add("Camponotus");

  for (const row of diffs) {
    genusSet.add(row.genus);
  }

  return Array.from(genusSet)
    .sort((a, b) => {
      const order = ["Camponotus", "Polyrhachis", "Formica", "Lasius", "Paratrechina", "Oecophylla", "Plagiolepis"];
      return order.indexOf(a) - order.indexOf(b);
    })
    .map((genus) => ({
      genus,
      name: GENUS_CN_MAP[genus] || genus,
    }));
}

// 获取某阶段在某属的差异化信息
export async function getStageDiff(stageKey: string, genus: string) {
  const { data, error } = await publicDb
    .from("stage_species_diffs")
    .select("*")
    .eq("stage_key", stageKey)
    .eq("genus", genus)
    .single();

  // 没有差异记录时返回 null（说明该属此阶段与基准一致）
  if (error && error.code === "PGRST116") return null;
  if (error) throw error;
  return data;
}

// 获取物种库统计信息（按亚科和属分组）
export async function getSpeciesStats() {
  const { data, error } = await publicDb
    .from("species")
    .select("subfamily, subfamily_cn, genus, genus_cn, id, beginner_friendly")
    .eq("status", 1);

  if (error) throw error;

  // 按亚科分组
  const bySubfamily: Record<string, { cn: string; genera: Array<{ genus: string; cn: string; count: number; beginnerCount: number }> }> = {};
  for (const sp of (data ?? [])) {
    const sf = sp.subfamily || "unknown";
    if (!bySubfamily[sf]) {
      bySubfamily[sf] = {
        cn: SUBFAMILY_CN_MAP[sf] || sf,
        genera: [],
      };
    }
    let g = bySubfamily[sf].genera.find((x) => x.genus === sp.genus);
    if (!g) {
      g = { genus: sp.genus, cn: GENUS_CN_MAP[sp.genus] || sp.genus, count: 0, beginnerCount: 0 };
      bySubfamily[sf].genera.push(g);
    }
    g.count++;
    if (sp.beginner_friendly) g.beginnerCount++;
  }

  // 总计
  const total = data?.length ?? 0;
  const totalBeginner = data?.filter((s) => s.beginner_friendly).length ?? 0;

  return { total, totalBeginner, bySubfamily };
}
