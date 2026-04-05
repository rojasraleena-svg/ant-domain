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
