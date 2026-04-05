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
      {/* 调整 pt 和 pb 以适合一屏的视差，并设置最小高度让布局撑开 */}
      <section className="relative overflow-hidden pt-12 pb-12 sm:pt-20 sm:pb-16 lg:pt-28 lg:pb-24 border-b border-white/[0.02] min-h-[calc(100vh-80px)] flex items-center">
        {/* 背景深邃弥散光 (替代了原先明显的色块) */}
        <div className="absolute top-1/4 right-0 w-[40vw] h-[40vw] rounded-full bg-primary/10 blur-[150px] pointer-events-none -z-10 mix-blend-screen" />
        <div className="absolute bottom-0 left-1/4 w-[30vw] h-[30vw] rounded-full bg-accent-warm/5 blur-[120px] pointer-events-none -z-10 mix-blend-screen" />

        <div className="relative container mx-auto px-4 lg:px-8 z-10 flex flex-col-reverse lg:grid lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full">

          {/* 左侧：排版与动作 (占 7 列) */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left z-10">
            {/* 极致光效的极简标签 */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.01] backdrop-blur-md px-4 py-1.5 mb-6 shadow-2xl">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_currentColor] animate-pulse" />
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/60">
                AI Powered Observatory
              </span>
            </div>

            {/* Awwwards 级别的高反差 Typography - 稍微调小一点字体高度使得比例更匀称 */}
            <h1 className="text-[3.5rem] sm:text-[5rem] lg:text-[6.5rem] font-light tracking-tighter leading-[0.9] text-foreground">
               <span className="block text-foreground/70 mb-1">探索</span>
               <span className="font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-primary/90 to-primary/40 drop-shadow-2xl">
                 蚁域
               </span>
               <span className="block mt-1 font-normal text-foreground/90">微观帝国.</span>
            </h1>

            {/* 优雅的副标题 */}
            <p className="mt-6 text-sm sm:text-base lg:text-lg text-muted-foreground/50 font-light tracking-wide max-w-lg leading-relaxed">
              在沉浸式数字显微镜下，阅览物种资料、研习饲养阶段，并记录蜂群生长的每一个微小奇迹。
            </p>

            {/* 现代化精简的按钮组合 */}
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link
                href="/species"
                className="group relative flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-3.5 rounded-full bg-foreground text-background font-bold text-sm tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,0.1)]"
              >
                开始探索
                <IconArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/colonies/new"
                className="group flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-3.5 rounded-full border border-white/10 bg-transparent text-foreground/70 font-medium text-sm tracking-wide transition-colors hover:bg-white/5 hover:text-foreground"
              >
                创建档案
              </Link>
            </div>

            {/* 像尺子一样精致的弱光数据统计条 - 减小 margin-top 以贴合整体框架 */}
            <div className="mt-12 flex items-center gap-10 sm:gap-14 w-full justify-center lg:justify-start">
              {[
                { num: '200+', label: '物种记录' },
                { num: '18', label: '亚科细分' },
                { num: 'AI', label: '智能分析' },
              ].map((s, i) => (
                <div key={s.label} className="relative text-center lg:text-left group">
                  {i !== 0 && (
                    <div className="absolute -left-5 sm:-left-7 top-1/2 -translate-y-1/2 w-px h-8 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                  )}
                  <p className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90 transition-colors group-hover:text-primary">{s.num}</p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground/40 font-semibold uppercase tracking-[0.2em] mt-1.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 右侧：深邃无界的沉浸式配图 (占 5 列) */}
          <div className="lg:col-span-5 relative w-full lg:h-[600px] flex items-center justify-center mt-8 lg:mt-0">
            {/* 修复遮罩：扩大可视范围，使其更接大图的霸气感 */}
            <div 
              className="relative w-full aspect-square lg:aspect-auto lg:h-full opacity-85 mix-blend-lighten" 
              style={{ 
                maskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)', 
                WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)' 
              }}
            >
              <img
                src="/images/hero-ant-macro.jpg"
                alt="Microscopic Ant"
                className="w-full h-full object-cover object-center grayscale-[0.1] contrast-[1.1] transition-transform duration-[30s] hover:scale-110 ease-out"
              />
            </div>
            
            {/* 微弱的光晕在图片背后托底 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-primary/10 blur-[100px] rounded-full pointer-events-none -z-10" />
            
            {/* 图片侧边的精细装饰性刻度 (增强科幻/显微镜感) */}
            <div className="absolute top-1/3 -left-2 sm:-left-4 flex flex-col gap-2 items-center opacity-30 select-none pointer-events-none">
               <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/80 to-transparent" />
               <span className="text-[8px] font-mono rotate-180 tracking-[0.2em] text-white" style={{ writingMode: 'vertical-rl' }}>SCALE 1:400</span>
               <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/80 to-transparent" />
            </div>

            {/* 右下角的现代极简标识 (调整到底部外框，避免被遮罩切割) */}
            <div className="absolute bottom-4 right-4 z-20 text-right opacity-60">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/20 mb-2">
                <IconAnt className="w-4 h-4 text-white" />
              </div>
              <p className="text-white text-xs font-mono tracking-widest">MACRO</p>
              <p className="text-white/40 text-[8px] uppercase tracking-[0.3em]">Vision</p>
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
