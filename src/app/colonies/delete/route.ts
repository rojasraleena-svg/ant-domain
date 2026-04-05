import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "未授权访问。" }, { status: 401 });
    }

    const formData = await request.formData();
    const colonyId = parseInt(formData.get("colonyId") as string, 10);

    if (!colonyId || Number.isNaN(colonyId)) {
      return NextResponse.json({ error: "无效的蚁群 ID" }, { status: 400 });
    }

    // 验证归属权
    const { data: colony, error: fetchError } = await db
      .from("colonies")
      .select("id")
      .eq("id", colonyId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !colony) {
      return NextResponse.json({ error: "蚁群不存在或无权限删除" }, { status: 404 });
    }

    // 先删除关联日志
    await db.from("colony_logs").delete().eq("colony_id", colonyId);

    // 再删除蚁群
    const { error: deleteError } = await db
      .from("colonies")
      .delete()
      .eq("id", colonyId);

    if (deleteError) {
      console.error("删除蚁群失败:", deleteError);
      return NextResponse.json({ error: "删除失败，请稍后重试" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete colony error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
