import Link from "next/link";
import { db } from "@/lib/db";

/* ============================================
   SVG 图标组件（替代 emoji）
   ============================================ */
function IconBook({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function IconCycle({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}

function IconAnt({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="13" rx="6" ry="4" />
      <circle cx="12" cy="7" r="3" />
      <path d="M6 12L3 9M18 12l3-3M9 17l-3 3M15 17l3 3" />
    </svg>
  );
}

function IconArrowRight({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export default async function HomePage() {
  const { data: recommendedSpecies } = await db
    .from("species")
    .select("id, name_cn, name_lat, genus_cn, beginner_friendly, summary")
    .eq("status", 1)
    .order("sort_order", { ascending: true })
    .limit(3);

  return (
    <div className="min-h-full">
      {/* ====== 沉浸式 Hero 区域 ====== */}
      <section className="relative overflow-hidden bg-gradient-hero pattern-dots">
        {/* 装饰性几何元素 */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {/* 大圆装饰 */}
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-1/3 -left-10 w-60 h-60 rounded-full bg-accent-warm/5 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-40 h-40 rounded-full bg-nature-green/5 blur-2xl" />
          {/* 抽象线条 — 蚁路暗示 */}
          <svg className="absolute bottom-0 left-0 w-full opacity-[0.04]" preserveAspectRatio="none" viewBox="0 0 1200 120">
            <path d="M0,100 Q300,20 600,80 T1200,40" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M0,110 Q400,50 800,90 T1200,60" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>

        <div className="relative container mx-auto px-4 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl mx-auto text-center animate-[fadeInUp_0.7s_ease-out]">
            {/* 标签 */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-[pulse-glow_2s_ease-in-out_infinite]" />
              AI 原生蚂蚁观察平台
            </div>

            {/* 主标题 */}
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.95]">
              <span className="text-gradient">蚁域</span>
            </h1>

            {/* 副标题 */}
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
              集蚂蚁资料库、生活史科普与个人蚁群记录于一体
              <br className="hidden sm:block" />
              <span className="text-foreground/70">查资料、学阶段、记成长</span>
            </p>

            {/* CTA 按钮组 */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/species"
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5"
              >
                开始探索
                <IconArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/colonies/new"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-8 py-3.5 text-sm font-semibold hover:bg-accent hover:border-primary/30 transition-all duration-300"
              >
                创建蚁群档案
              </Link>
            </div>
          </div>
        </div>

        {/* 底部渐变过渡 */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ====== 功能入口卡片 ====== */}
      <section className="container mx-auto px-4 -mt-10 relative z-10">
        <div className="grid gap-5 sm:grid-cols-3 max-w-4xl mx-auto">
          {/* 资料库 */}
          <Link
            href="/species"
            className="group card-hover rounded-2xl border bg-card p-6 sm:p-7 relative overflow-hidden"
          >
            {/* 左侧彩色条 */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-accent-warm rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="w-12 h-12 rounded-xl bg-primary/8 text-primary flex items-center justify-center mb-4 group-hover:bg-primary/12 transition-colors duration-300">
              <IconBook className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">资料库</h2>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              浏览蚁亚科物种资料，了解饲养方法与生态习性
            </p>
            <div className="mt-4 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
              浏览物种 <IconArrowRight className="w-3 h-3" />
            </div>
          </Link>

          {/* 生活史 */}
          <Link
            href="/lifecycle"
            className="group card-hover rounded-2xl border bg-card p-6 sm:p-7 relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-nature-green to-emerald-400 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="w-12 h-12 rounded-xl bg-nature-green/8 text-nature-green flex items-center justify-center mb-4 group-hover:bg-nature-green/12 transition-colors duration-300">
              <IconCycle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">生活史</h2>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              了解蚂蚁从婚飞到成熟的完整生命历程
            </p>
            <div className="mt-4 text-xs font-medium text-nature-green opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
              探索阶段 <IconArrowRight className="w-3 h-3" />
            </div>
          </Link>

          {/* 我的蚁群 */}
          <Link
            href="/colonies/new"
            className="group card-hover rounded-2xl border bg-card p-6 sm:p-7 relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-warm to-amber-400 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="w-12 h-12 rounded-xl bg-accent-warm/8 text-accent-warm flex items-center justify-center mb-4 group-hover:bg-accent-warm/12 transition-colors duration-300">
              <IconAnt className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">我的蚁群</h2>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              创建蚁群档案，记录成长过程，AI 辅助分析
            </p>
            <div className="mt-4 text-xs font-medium text-accent-warm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
              开始记录 <IconArrowRight className="w-3 h-3" />
            </div>
          </Link>
        </div>
      </section>

      {/* ====== 推荐物种预览 ====== */}
      <section className="container mx-auto px-4 py-16 sm:py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight title-deco">
              推荐物种
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              精选适合入门饲养的蚂蚁物种
            </p>
          </div>
          <Link
            href="/species"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors group"
          >
            查看全部
            <IconArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {!recommendedSpecies || recommendedSpecies.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border bg-card p-5 animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="h-5 w-24 skeleton-shimmer rounded-md mb-3" />
                <div className="h-4 w-40 skeleton-shimmer rounded-md" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedSpecies.map((sp, i) => (
              <Link
                key={sp.id}
                href={`/species/${sp.id}`}
                className="group card-hover rounded-2xl border bg-card p-5 sm:p-6 relative"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* 左上角彩色圆点 */}
                <div className="absolute top-5 left-5 w-2.5 h-2.5 rounded-full bg-primary/60 group-hover:bg-primary transition-colors duration-300" />

                <div className="flex items-start justify-between">
                  <div className="pl-4">
                    <h3 className="font-bold group-hover:text-primary transition-colors duration-200">
                      {sp.name_cn}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5 italic font-light">
                      {sp.name_lat}
                    </p>
                  </div>
                  {sp.beginner_friendly && (
                    <span className="rounded-full bg-nature-green/10 text-nature-green dark:bg-nature-green/20 dark:text-nature-green/80 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap border border-nature-green/15">
                      新手推荐
                    </span>
                  )}
                </div>
                {sp.summary && (
                  <p className="mt-3 text-sm line-clamp-2 text-muted-foreground leading-relaxed pl-4">
                    {sp.summary}
                  </p>
                )}

                {/* Hover 底部提示 */}
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 pl-4">
                  <span className="text-xs text-muted-foreground">{sp.genus_cn}</span>
                  <IconArrowRight className="w-3.5 h-3.5 text-primary" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 移动端查看全部按钮 */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/species"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
          >
            查看全部物种 <IconArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
