import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/gallery
 * 公共图片画廊 API（无需登录）
 *
 * Query params:
 * - page: 页码 (default 1)
 * - pageSize: 每页数量 (default 24, max 48)
 * - search: 搜索关键词（物种名）
 * - style: 风格筛选
 * - speciesId: 指定物种 ID
 * - featured: 是否只看精选 (true/false)
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const pageSize = Math.min(48, Math.max(1, parseInt(url.searchParams.get("pageSize") || "24", 10)));
  const search = url.searchParams.get("search")?.trim() || "";
  const styleFilter = url.searchParams.get("style") || "";
  const speciesId = url.searchParams.get("speciesId");
  const featuredOnly = url.searchParams.get("featured") === "true";

  let query = db
    .from("generated_images")
    .select(
      "id, species_id, url, thumbnail_url, prompt, model, view_type, style, caste, is_featured, created_at, species(name_cn, name_lat)",
      { count: "exact" }
    )
    .eq("status", 1)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (featuredOnly) {
    query = query.eq("is_featured", true);
  }

  if (styleFilter && styleFilter !== "all") {
    query = query.eq("style", styleFilter);
  }

  if (speciesId) {
    query = query.eq("species_id", parseInt(speciesId, 10));
  }

  if (search) {
    query = query.or(`species.name_cn.ilike.%${search}%,species.name_lat.ilike.%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = page * pageSize - 1;

  const { data, count, error } = await query.range(from, to);

  if (error) {
    console.error("[gallery] Error:", error.message);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }

  return NextResponse.json({
    images: data || [],
    total: count || 0,
    page,
    pageSize,
  });
}
