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
        {/* 背景深邃弥散光 (恢复项目主色调) */}
        <div className="absolute top-1/4 right-0 w-[40vw] h-[40vw] rounded-full bg-primary/10 blur-[150px] pointer-events-none -z-10 mix-blend-screen" />
        <div className="absolute bottom-0 left-1/4 w-[30vw] h-[30vw] rounded-full bg-accent-warm/5 blur-[120px] pointer-events-none -z-10 mix-blend-screen" />

        <div className="relative container mx-auto px-4 lg:px-8 z-10 flex flex-col-reverse lg:grid lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full">

          {/* 左侧：排版与动作 (占 7 列) 加大右侧内边距，远离图片 */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left z-10 w-full xl:pr-12">

            {/* STOD 极简高冷排版：巨大的负间距、极其克制的装饰、绝对的对齐 */}
            <div className="flex flex-col items-start w-full select-none">
              
              {/* ====== 主标题：蚁域 ====== */}
              {/* 极致压缩的字距 (tracking-tighter)，回归纯粹的几何张力，完全水平排列 */}
              <h1 className="text-[6rem] sm:text-[8rem] lg:text-[10rem] xl:text-[13rem] font-serif leading-[0.8] tracking-tighter flex flex-row items-baseline group relative pt-8">
                <span className="text-foreground transition-transform duration-700 ease-out group-hover:-translate-y-2">
                  蚁
                </span>
                {/* 镂空描边，并排对齐 */}
                <span className="text-transparent ml-2 transition-transform duration-700 ease-out group-hover:translate-x-3"
                      style={{ WebkitTextStroke: '1px rgba(255,255,255,0.75)' }}>
                  域<span className="text-white/20 font-sans text-5xl sm:text-7xl xl:text-8xl align-baseline ml-1">.</span>
                </span>
              </h1>

            </div>

            {/* ====== 新版信息架构 (STOD 结构：水平穿插数据带) ====== */}
            <div className="mt-16 lg:mt-24 w-full flex flex-col gap-14 max-w-3xl">
                
              {/* 描述组：极简装饰，严格左对齐 */}
              <div className="flex flex-col gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-[2px] bg-primary/80" />
                  <span className="text-[10px] font-bold tracking-[0.5em] text-foreground/70 uppercase whitespace-nowrap">
                    微观帝国 / Empire
                  </span>
                </div>
                {/* 取消 pl，换用更大的行高和字距，极致留白 */}
                <p className="text-sm text-muted-foreground/50 font-light tracking-[0.25em] leading-[2.2] break-keep whitespace-nowrap sm:whitespace-normal">
                  在沉浸式数字显微镜下，览阅详尽的物种资料
                  <br className="hidden sm:block" />
                  研习饲养阶段，记录蚂蚁生态的每一处奇迹。
                </p>
              </div>

              {/* 数据流：引入隐形列网格 (Grid)，彻底根治宽窄字符导致的视觉位移错乱 */}
              <div className="grid grid-cols-3 items-start gap-4 sm:gap-8 w-full max-w-lg pt-2 md:pt-4">
                {[
                  { num: '200+', label: 'Species' },
                  { num: '18', label: 'Families' },
                  { num: 'AI', label: 'Analysis' },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col gap-1.5 group cursor-default">
                    {/* 压缩行高 (leading-none) 让数字和英文 Label 的物理缝隙能精准控制，形成格式塔整体 */}
                    <p className="text-4xl sm:text-[40px] leading-none font-serif font-light tracking-wide text-white/90 transition-all duration-700 group-hover:text-primary group-hover:-translate-y-0.5">
                      {s.num}
                    </p>
                    {/* 使用负外边距 (-mr-[0.4em]) 抵消极宽字距造成的右侧留白错觉，保证整体完美左对齐 */}
                    <p className="text-[10px] text-muted-foreground/40 font-mono uppercase tracking-[0.4em] -mr-[0.4em]">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* 按钮组合：坚实的矩阵感底盘 */}
              {/* 增加整体间距，拉开与数据的层次节奏 */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                <Link
                  href="/species"
                  className="group relative flex items-center justify-center w-full sm:w-[160px] h-[52px] bg-primary text-black font-bold text-[13px] tracking-[0.3em] whitespace-nowrap uppercase transition-all duration-700 hover:bg-white hover:text-black active:scale-[0.98]"
                >
                  {/* 对带有大字距的中文字符，必须利用 pl-[0.3em] 进行光学绝对居中补偿 */}
                  <span className="pl-[0.3em]">探索</span>
                  {/* 悬浮修饰线改为绝对定位，不再参与 flex 挤压，保证文字永绝对居中 */}
                  <div className="absolute right-6 w-4 h-px bg-black opacity-40 group-hover:w-6 group-hover:opacity-100 transition-all duration-700"></div>
                </Link>
                <Link
                  href="/colonies/new"
                  className="group flex items-center justify-center w-full sm:w-[160px] h-[52px] border border-white/20 bg-transparent text-white/60 font-medium text-[13px] tracking-[0.3em] whitespace-nowrap uppercase transition-all duration-700 hover:text-white hover:border-white/80 active:scale-[0.98]"
                >
                  {/* 同理，光学绝对居中补偿 */}
                  <span className="pl-[0.3em]">创建</span>
                </Link>
              </div>
            </div>
          </div>

          {/* 右侧：深邃无界的沉浸式配图 (占 5 列) */}
          <div className="lg:col-span-5 relative w-full lg:h-[600px] max-h-[45vh] lg:max-h-none flex items-center justify-center mt-6 lg:mt-0">
            {/* 图片容器：径向遮罩 + 细边框界定 */}
            <div
              className="relative w-full aspect-square lg:aspect-auto lg:h-full opacity-90 mix-blend-lighten overflow-hidden rounded-2xl lg:rounded-3xl ring-1 ring-white/[0.08] group"
              style={{
                maskImage: 'radial-gradient(circle at center, black 50%, transparent 85%)',
                WebkitMaskImage: 'radial-gradient(circle at center, black 50%, transparent 85%)'
              }}
            >
              <img
                src="/images/hero-ant-macro.jpg"
                alt="Microscopic Ant"
                // 恢复色彩：亮度调暗，悬停放大且恢复全量颜色
                className="w-full h-full object-cover object-center brightness-90 transition-all duration-[4s] ease-out group-hover:scale-[1.08] group-hover:brightness-110"
              />
            </div>
            
            {/* 微弱的光晕在图片背后托底，恢复彩色投影 */}
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
