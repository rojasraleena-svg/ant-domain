import { db } from "@/lib/db";
import {
  LayoutDashboard,
  Users,
  Image,
  Bug,
  Shield,
  Calendar,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

async function getDashboardData() {
  // 基础统计
  const [speciesRes, usersRes, imagesRes] = await Promise.all([
    db.from("species").select("id", { count: "exact", head: true }),
    db.from("users").select("id", { count: "exact", head: true }),
    db
      .from("generated_images")
      .select("id", { count: "exact", head: true })
      .eq("status", 1),
  ]);

  // 用户详情列表（含蚁群数量）
  const { data: users } = await db
    .from("users")
    .select("id, username, role, created_at, colonies(count)")
    .order("created_at", { ascending: false });

  // 最近生成的图片
  const { data: recentImages } = await db
    .from("generated_images")
    .select(
      "id, url, model, created_at, species_id, species(name_cn, name_lat), created_by, users(username)"
    )
    .eq("status", 1)
    .order("created_at", { ascending: false })
    .limit(6);

  return {
    speciesCount: speciesRes.count || 0,
    usersCount: usersRes.count || 0,
    imagesCount: imagesRes.count || 0,
    users: (users || []) as Array<{
      id: string;
      username: string;
      role: string;
      created_at: string;
      colonies: { count: number }[];
    }>,
    recentImages: recentImages || [],
  };
}

const ROLE_STYLES: Record<string, string> = {
  admin:
    "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  user: "bg-muted/50 text-muted-foreground border-white/[0.06]",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "管理员",
  user: "用户",
};

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "今天";
    if (diffDays === 1) return "昨天";
    if (diffDays < 7) return `${diffDays} 天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`;
    return d.toLocaleDateString("zh-CN");
  };

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <LayoutDashboard className="w-6 h-6 text-primary" />
          仪表盘
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          蚁域平台运营概览
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "物种",
            value: data.speciesCount.toLocaleString(),
            icon: Bug,
            color: "bg-primary/10 text-primary",
          },
          {
            label: "用户",
            value: data.usersCount.toLocaleString(),
            icon: Users,
            color: "bg-blue-500/10 text-blue-400",
          },
          {
            label: "AI 插图",
            value: data.imagesCount.toLocaleString(),
            icon: Image,
            color: "bg-purple-500/10 text-purple-400",
          },
          {
            label: "管理员",
            value: data.users.filter((u) => u.role === "admin").length.toString(),
            icon: Shield,
            color: "bg-yellow-500/10 text-yellow-500",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border border-white/[0.06] bg-card p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </span>
                <div className={`rounded-lg p-2 ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold tracking-tight">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* 用户列表 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            用户列表
          </h2>
          <span className="text-xs text-muted-foreground">
            共 {data.users.length} 人
          </span>
        </div>

        {data.users.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-card/50 p-8 text-center">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">暂无注册用户</p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-card overflow-hidden">
            {/* 表头 */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 bg-muted/30 text-[11px] font-medium uppercase tracking-wider text-muted-foreground border-b border-white/[0.04]">
              <div className="col-span-3">用户名</div>
              <div className="col-span-2">角色</div>
              <div className="col-span-3">注册时间</div>
              <div className="col-span-2 text-right">蚁群数</div>
              <div className="col-span-2"></div>
            </div>

            {/* 表格行 */}
            {data.users.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-3.5 items-center border-b border-white/[0.04] last:border-b-0 hover:bg-accent/20 transition-colors"
              >
                {/* 用户名 */}
                <div className="sm:col-span-3 flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium truncate">{user.username}</span>
                  {user.role === "admin" && (
                    <Shield className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                  )}
                </div>

                {/* 角色 */}
                <div className="sm:col-span-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                      ROLE_STYLES[user.role] || ROLE_STYLES.user
                    }`}
                  >
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                </div>

                {/* 注册时间 */}
                <div className="sm:col-span-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 shrink-0 opacity-50" />
                  <span>{formatTime(user.created_at)}</span>
                  <span className="text-[11px] opacity-50 hidden lg:inline">
                    ({new Date(user.created_at).toLocaleDateString("zh-CN")})
                  </span>
                </div>

                {/* 蚁群数 */}
                <div className="sm:col-span-2 text-right">
                  <span className="text-sm font-medium tabular-nums">
                    {(user.colonies?.[0]?.count ?? 0).toLocaleString()}
                  </span>
                  <span className="text-[11px] text-muted-foreground ml-1">个</span>
                </div>

                {/* 操作占位 */}
                <div className="sm:col-span-2 hidden sm:flex justify-end">
                  {/* 未来可扩展：查看详情、改角色等 */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 最近生成的图片 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Image className="w-5 h-5 text-muted-foreground" />
            最近生成
          </h2>
          <Link
            href="/admin/images"
            className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1 group"
          >
            查看全部
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {data.recentImages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-card/50 p-8 text-center">
            <Image className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">暂无 AI 生成图片</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {data.recentImages.map((img) => {
              const species = (Array.isArray(img.species)
                ? img.species[0]
                : img.species) as {
                name_cn: string;
                name_lat: string;
              } | null;
              const creator = (Array.isArray(img.users) ? img.users[0] : img.users) as { username: string } | null;

              return (
                <div
                  key={img.id}
                  className="group relative rounded-lg overflow-hidden border border-white/[0.06] bg-card aspect-square"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={`${species?.name_cn || ""} 插图`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white truncate font-medium">
                      {species?.name_cn || "未知物种"}
                    </p>
                    <p className="text-[9px] text-white/60 flex items-center gap-1">
                      {creator && <span>by {creator.username}</span>}
                      <span className="ml-auto">
                        {new Date(img.created_at).toLocaleDateString("zh-CN")}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
