import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ user: null });
  }

  // 从数据库实时查询角色（避免 token 中无 role 的兼容问题）
  const { data: dbUser } = await db
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      role: dbUser?.role || user.role || "user",
    },
  });
}
