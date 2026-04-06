import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-api";
import { db } from "@/lib/db";

/**
 * GET /api/admin/images
 * 管理员获取 AI 生成图片列表（服务端查询，绕过 RLS）
 *
 * Query params:
 * - page: 页码 (default 1)
 * - pageSize: 每页数量 (default 12)
 * - search: 搜索关键词
 * - style: 风格筛选
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get("pageSize") || "12", 10)));
  const search = url.searchParams.get("search")?.trim() || "";
  const styleFilter = url.searchParams.get("style") || "";

  let query = db
    .from("generated_images")
    .select(
      "*, species(name_cn, name_lat)",
      { count: "exact" }
    )
    .eq("status", 1)
    .order("created_at", { ascending: false });

  if (styleFilter && styleFilter !== "all") {
    query = query.eq("style", styleFilter);
  }

  if (search) {
    query = query.or(
      `prompt.ilike.%${search}%,species.name_cn.ilike.%${search}%`
    );
  }

  const from = (page - 1) * pageSize;
  const to = page * pageSize - 1;

  const { data, count, error } = await query.range(from, to);

  if (error) {
    console.error("[admin/images] Error:", error.message);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }

  // 单独查询创建者用户名（created_by 无外键关系）
  const creatorIds = [...new Set((data || []).map((img) => img.created_by).filter(Boolean))];
  const usernameMap: Record<string, string> = {};
  if (creatorIds.length > 0) {
    const { data: creators } = await db
      .from("users")
      .select("id, username")
      .in("id", creatorIds);
    for (const u of creators || []) {
      usernameMap[u.id] = u.username;
    }
  }

  // 附加用户名到图片数据
  const images = (data || []).map((img) => ({
    ...img,
    creatorUsername: img.created_by ? (usernameMap[img.created_by] || null) : null,
  }));

  return NextResponse.json({
    images,
    total: count || 0,
    page,
    pageSize,
  });
}

/**
 * PATCH /api/admin/images
 * 管理员更新图片（设为封面 / 软删除）
 */
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  const body = await request.json();
  const { id, is_featured, status } = body;

  if (!id) {
    return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof is_featured === "boolean") updates.is_featured = is_featured;
  if (typeof status === "number") updates.status = status;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "没有要更新的字段" }, { status: 400 });
  }

  const { data, error } = await db
    .from("generated_images")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[admin/images] Update error:", error.message);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }

  return NextResponse.json({ image: data });
}
