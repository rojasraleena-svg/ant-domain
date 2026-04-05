import Link from "next/link";
import { db } from "@/lib/db";

export default async function HomePage() {
  // 加载推荐物种（新手优先 + 有排序值的）
  const { data: recommendedSpecies } = await db
    .from("species")
    .select("id, name_cn, name_lat, genus_cn, beginner_friendly, summary")
    .eq("status", 1)
    .order("sort_order", { ascending: true })
    .limit(3);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero */}
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          蚁域
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          集蚂蚁资料库、生活史科普与个人蚁群记录于一体的 AI 原生平台。
          <br />
          查资料、学阶段、记成长。
        </p>
      </section>

      {/* 快捷入口 */}
      <section className="grid gap-4 sm:grid-cols-3 mb-12">
        <Link
          href="/species"
          className="group rounded-lg border bg-card p-6 transition-colors hover:bg-accent"
        >
          <div className="text-2xl mb-2">📚</div>
          <h2 className="text-lg font-semibold">资料库</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            浏览蚁亚科物种资料，了解饲养方法
          </p>
        </Link>

        <Link
          href="/lifecycle"
          className="group rounded-lg border bg-card p-6 transition-colors hover:bg-accent"
        >
          <div className="text-2xl mb-2">🔄</div>
          <h2 className="text-lg font-semibold">生活史</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            了解弓背蚁从婚飞到成熟的完整生命历程
          </p>
        </Link>

        <Link
          href="/colonies/new"
          className="group rounded-lg border bg-card p-6 transition-colors hover:bg-accent"
        >
          <div className="text-2xl mb-2">🐜</div>
          <h2 className="text-lg font-semibold">我的蚁群</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            创建蚁群档案，记录成长过程
          </p>
        </Link>
      </section>

      {/* 推荐物种预览 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">推荐物种</h2>
          <Link
            href="/species"
            className="text-sm text-primary hover:underline"
          >
            查看全部 →
          </Link>
        </div>

        {!recommendedSpecies || recommendedSpecies.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-lg border bg-card p-4 animate-pulse"
              >
                <div className="h-5 w-24 bg-muted rounded mb-2" />
                <div className="h-4 w-40 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedSpecies.map((sp) => (
              <Link
                key={sp.id}
                href={`/species/${sp.id}`}
                className="group rounded-lg border bg-card p-5 transition-colors hover:bg-accent"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium group-hover:text-primary transition-colors">
                      {sp.name_cn}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5 italic">
                      {sp.name_lat}
                    </p>
                  </div>
                  {sp.beginner_friendly && (
                    <span className="rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 text-xs whitespace-nowrap">
                      新手推荐
                    </span>
                  )}
                </div>
                {sp.summary && (
                  <p className="mt-2 text-sm line-clamp-2 text-muted-foreground">
                    {sp.summary}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
