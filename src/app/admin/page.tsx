import { db } from "@/lib/db";
import { LayoutDashboard, Users, Image, Bug } from "lucide-react";
import Link from "next/link";

async function getDashboardStats() {
  const [speciesRes, usersRes, imagesRes] = await Promise.all([
    db.from("species").select("id", { count: "exact", head: true }),
    db.from("users").select("id", { count: "exact", head: true }),
    db.from("generated_images")
      .select("id", { count: "exact", head: true })
      .eq("status", 1),
  ]);

  // 最近生成的图片
  const { data: recentImages } = await db
    .from("generated_images")
    .select("id, url, model, created_at, species_id, species(name_cn, name_lat)")
    .eq("status", 1)
    .order("created_at", { ascending: false })
    .limit(6);

  return {
    speciesCount: speciesRes.count || 0,
    usersCount: usersRes.count || 0,
    imagesCount: imagesRes.count || 0,
    recentImages: recentImages || [],
  };
}

const statCards = [
  { key: "speciesCount" as const, label: "物种数量", icon: Bug, color: "bg-primary/10 text-primary" },
  { key: "usersCount" as const, label: "注册用户", icon: Users, color: "bg-blue-500/10 text-blue-400" },
  { key: "imagesCount" as const, label: "AI 插图", icon: Image, color: "bg-purple-500/10 text-purple-400" },
];

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
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
              <p className="text-3xl font-bold tracking-tight">
                {stats[card.key].toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      {/* 最近生成的图片 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">最近生成</h2>
          <Link
            href="/admin/images"
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            查看全部 →
          </Link>
        </div>

        {stats.recentImages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-card/50 p-8 text-center">
            <Image className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">暂无 AI 生成图片</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {stats.recentImages.map((img) => {
              const species = (Array.isArray(img.species) ? img.species[0] : img.species) as { name_cn: string; name_lat: string } | null;
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
                    <p className="text-[9px] text-white/60">
                      {img.model} ·{" "}
                      {new Date(img.created_at).toLocaleDateString("zh-CN")}
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
