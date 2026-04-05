"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function deleteColony(colonyId: string) {
  const user = await getSession();
  if (!user) redirect("/login");

  const id = parseInt(colonyId, 10);
  if (!id || Number.isNaN(id)) {
    redirect(`/colonies/${colonyId}?message=${encodeURIComponent("无效的蚁群 ID")}`);
  }

  // 验证归属权
  const { data: colony, error: fetchError } = await db
    .from("colonies")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !colony) {
    redirect(`/colonies?message=${encodeURIComponent("蚁群不存在或无权限删除")}`);
  }

  // 先删除关联日志
  await db.from("colony_logs").delete().eq("colony_id", id);

  // 再删除蚁群
  const { error: deleteError } = await db
    .from("colonies")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("删除蚁群失败:", deleteError);
    redirect(`/colonies/${colonyId}?message=${encodeURIComponent("删除失败，请稍后重试")}`);
  }

  redirect("/colonies");
}
