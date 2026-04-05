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

/* 装饰性网格背景 */
function GridPattern() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
      style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }}
    />
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
    <div className="min-h-full relative">
      {/* 全局装饰网格 */}
      <GridPattern />

      {/* ====== Hero 区域 ====== */}
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pt-40 lg:pb-28">
        {/* 背景光晕 — 更柔和、更有层次 */}
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/8 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent-warm/6 blur-[120px] pointer-events-none" />

        <div className="relative container mx-auto px-4 lg:px-8 z-10 grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">

          {/* 左侧：视觉图像 — 占 2 列 */}
          <div className="lg:col-span-2 relative w-full max-w-[420px] mx-auto lg:max-w-full lg:mx-0">
            {/* 发光底层 */}
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-tr from-primary/15 via-accent-warm/8 to-transparent blur-xl opacity-60 pointer-events-none" />

            {/* 图片容器 */}
            <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/[0.08] bg-white/[0.03] shadow-2xl shadow-black/40 group">
              {/* 底部渐变遮罩 — 更轻，让图片更突出 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 pointer-events-none" />

              <img
                src="/images/hero-ant-macro.jpg"
                alt="蚂蚁微距摄影"
                className="w-full h-full object-cover transition-transform duration-[15s] group-hover:scale-105"
              />

              {/* 底部标签 — 高对比度胶囊 */}
              <div className="absolute bottom-5 left-5 z-20 flex items-center gap-2.5 bg-black/50 backdrop-blur-md rounded-full pl-1 pr-4 py-1.5 border border-white/10">
                <div className="w-7 h-7 rounded-full bg-primary/90 flex items-center justify-center">
                  <IconAnt className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-none">微观生态</p>
                  <p className="text-[10px] text-white/50 uppercase tracking-wider">Observatory</p>
                </div>
              </div>
            </div>

            {/* 浮动装饰数据卡片 */}
            <div className="absolute -right-2 lg:-right-6 top-1/4 bg-card/80 backdrop-blur-lg rounded-2xl border border-white/[0.08] p-3 shadow-xl shadow-black/30 hidden sm:flex items-center gap-3 animate-float">
              <div className="w-9 h-9 rounded-xl bg-nature-green/10 flex items-center justify-center">
                <span className="text-nature-green font-bold text-sm">200+</span>
              </div>
              <div>
                <p className="text-[11px] font-medium text-foreground/70">物种收录</p>
                <p className="text-[10px] text-muted-foreground/50">持续更新中</p>
              </div>
            </div>
          </div>

          {/* 右侧：文案 — 占 3 列 */}
          <div className="lg:col-span-3 flex flex-col items-center lg:items-start text-center lg:text-left">

            {/* 标签 — 更紧凑醒目 */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[11px] font-semibold tracking-widest text-primary mb-6">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
              </span>
              AI 原生蚂蚁观察平台
            </div>

            {/* 主标题 — 缩小到合理尺寸 */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-foreground mb-5">
              探索
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-accent-warm"> 蚁域 </span>
              微观帝国
            </h1>

            {/* 副标题 — 加粗提亮 */}
            <p className="text-base sm:text-lg text-foreground/60 font-normal leading-relaxed max-w-md lg:max-w-lg mb-8">
              数字显微镜下的蚂蚁世界 —— 查物种资料、学饲养阶段、记录蚁群成长轨迹
            </p>

            {/* CTA 按钮组 */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/species"
                className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-xl bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-primary/40"
              >
                开始探索
                <IconArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/colonies/new"
                className="inline-flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-foreground/70 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.08] hover:text-foreground/90 hover:border-white/15"
              >
                创建档案
              </Link>
            </div>

            {/* 快捷统计条 */}
            <div className="flex items-center gap-6 mt-10 pt-8 border-t border-white/[0.06]">
              {[
                { num: '200+', label: '物种' },
                { num: '18', label: '亚科' },
                { num: 'AI', label: '辅助' },
              ].map((s) => (
                <div key={s.label} className="text-center lg:text-left">
                  <p className="text-lg font-black text-foreground/90">{s.num}</p>
                  <p className="text-[11px] text-muted-foreground/50 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====== 分隔线 + 功能入口 ====== */}
      <section className="relative pb-20">
        {/* 区域标题 */}
        <div className="container mx-auto px-4 mb-10">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">核心功能</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </div>

        <div className="container mx-auto px-4">
          <div className="grid gap-5 sm:grid-cols-3 max-w-5xl mx-auto">
            {/* 资料库 */}
            <Link
              href="/species"
              className="group relative rounded-2xl overflow-hidden border border-white/[0.06] bg-gradient-to-b from-primary/[0.08] to-card/30 backdrop-blur-sm p-7 transition-all duration-400 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/15"
            >
              {/* 角落编号 */}
              <span className="absolute top-4 right-4 text-4xl font-black text-white/[0.03] select-none group-hover:text-primary/[0.08] transition-colors">01</span>

              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/15 text-primary flex items-center justify-center mb-5 group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
                <IconBook className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground/90 group-hover:text-primary transition-colors">资料库</h2>
              <p className="mt-2.5 text-sm text-muted-foreground/55 leading-relaxed">
                浏览蚁亚科物种资料，了解饲养方法与生态习性
              </p>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-8px] group-hover:translate-x-0 duration-300">
                进入资料库 <IconArrowRight className="w-3 h-3" />
              </div>
            </Link>

            {/* 生活史 */}
            <Link
              href="/lifecycle"
              className="group relative rounded-2xl overflow-hidden border border-white/[0.06] bg-gradient-to-b from-nature-green/[0.06] to-card/30 backdrop-blur-sm p-7 transition-all duration-400 hover:-translate-y-1 hover:shadow-xl hover:shadow-nature-green/5 hover:border-nature-green/15"
            >
              <span className="absolute top-4 right-4 text-4xl font-black text-white/[0.03] select-none group-hover:text-nature-green/[0.08] transition-colors">02</span>

              <div className="w-12 h-12 rounded-xl bg-nature-green/10 border border-nature-green/15 text-nature-green flex items-center justify-center mb-5 group-hover:bg-nature-green/15 group-hover:scale-110 transition-all duration-300">
                <IconCycle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground/90 group-hover:text-nature-green transition-colors">生活史</h2>
              <p className="mt-2.5 text-sm text-muted-foreground/55 leading-relaxed">
                了解蚂蚁从婚飞到成熟的完整生命历程
              </p>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-nature-green/60 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-8px] group-hover:translate-x-0 duration-300">
                了解生活史 <IconArrowRight className="w-3 h-3" />
              </div>
            </Link>

            {/* 我的蚁群 */}
            <Link
              href="/colonies"
              className="group relative rounded-2xl overflow-hidden border border-white/[0.06] bg-gradient-to-b from-accent-warm/[0.06] to-card/30 backdrop-blur-sm p-7 transition-all duration-400 hover:-translate-y-1 hover:shadow-xl hover:shadow-accent-warm/5 hover:border-accent-warm/15"
            >
              <span className="absolute top-4 right-4 text-4xl font-black text-white/[0.03] select-none group-hover:text-accent-warm/[0.08] transition-colors">03</span>

              <div className="w-12 h-12 rounded-xl bg-accent-warm/10 border border-accent-warm/15 text-accent-warm flex items-center justify-center mb-5 group-hover:bg-accent-warm/15 group-hover:scale-110 transition-all duration-300">
                <IconAnt className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground/90 group-hover:text-accent-warm transition-colors">我的蚁群</h2>
              <p className="mt-2.5 text-sm text-muted-foreground/55 leading-relaxed">
                创建蚁群档案，记录成长过程，AI 辅助分析
              </p>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-accent-warm/60 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-8px] group-hover:translate-x-0 duration-300">
                管理蚁群 <IconArrowRight className="w-3 h-3" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ====== 推荐物种预览 ====== */}
      <section className="container mx-auto px-4 py-16 sm:py-20 relative">
        {/* 标题区 */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-7 rounded-full bg-gradient-to-b from-primary to-primary/30" />
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground/95">
                推荐物种
              </h2>
            </div>
            <p className="text-sm text-muted-foreground/60 ml-4">
              精选适合入门饲养的蚂蚁物种
            </p>
          </div>
          <Link
            href="/species"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-primary/80 hover:text-primary transition-colors group"
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
                className="rounded-2xl border border-white/[0.05] bg-card/30 p-6 animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="h-5 w-24 skeleton-shimmer rounded-md mb-3" />
                <div className="h-4 w-40 skeleton-shimmer rounded-md" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedSpecies.map((sp, i) => (
              <Link
                key={sp.id}
                href={`/species/${sp.id}`}
                className="group block relative rounded-2xl border border-white/[0.05] bg-card/20 backdrop-blur-sm p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 hover:border-white/[0.1] hover:bg-card/30"
              >
                {/* 左侧彩色竖条 */}
                <div className={`absolute left-0 top-6 bottom-6 w-[3px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  i === 0 ? 'bg-primary' : i === 1 ? 'bg-nature-green' : 'bg-accent-warm'
                }`} />

                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-foreground/90 group-hover:text-foreground transition-colors tracking-tight">
                        {sp.name_cn}
                      </h3>
                      <p className="text-xs text-muted-foreground/45 mt-0.5 italic font-light">
                        {sp.name_lat}
                      </p>
                    </div>
                    {sp.beginner_friendly && (
                      <span className="shrink-0 rounded-full bg-nature-green/10 text-nature-green ring-1 ring-nature-green/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        推荐
                      </span>
                    )}
                  </div>

                  {sp.summary && (
                    <p className="text-sm text-muted-foreground/60 leading-relaxed line-clamp-2 mt-1">
                      {sp.summary}
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground/40 uppercase tracking-wider">
                      {sp.genus_cn}
                    </span>
                    <IconArrowRight className="w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-primary/60 group-hover:translate-x-0.5 transition-all duration-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 移动端查看全部按钮 */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/species?tag=beginner"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm px-6 py-2.5 text-sm font-semibold text-foreground/70"
          >
            查看全部新手推荐 <IconArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
