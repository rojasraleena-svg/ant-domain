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
      <section className="relative overflow-hidden pt-20 pb-20 sm:pt-28 sm:pb-32 lg:pt-36 lg:pb-36 flex items-center justify-center">
        {/* 装饰性背景光晕 */}
        <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] rounded-full bg-accent-warm/5 blur-[120px] pointer-events-none -z-10" />

        <div className="relative container mx-auto px-4 lg:px-8 z-10 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* 左侧：视觉图像 */}
          <div className="relative w-full max-w-[500px] mx-auto lg:max-w-full">
            {/* 发光底层 */}
            <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-tr from-primary/20 via-accent-warm/10 to-transparent blur-2xl opacity-50 animate-pulse pointer-events-none" />
            
            {/* 图片容器 */}
            <div className="relative w-full aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl group">
              <div className="absolute inset-0 bg-gradient-to-tr from-background/90 via-background/20 to-transparent z-10 pointer-events-none" />
              
              {/* 高亮微距图 - 使用 Unsplash 素材 */}
              <img 
                src="https://images.unsplash.com/photo-1544640808-32cb4f68696d?auto=format&fit=crop&q=80&w=1200" 
                alt="Macro Ant Illustration" 
                className="w-full h-full object-cover transition-transform duration-[20s] group-hover:scale-110"
              />
              
              {/* 视觉层点缀信息 */}
              <div className="absolute bottom-8 left-8 z-20 pointer-events-none transition-transform duration-500 group-hover:-translate-y-2">
                 <div className="w-10 h-0.5 bg-primary/80 mb-4" />
                 <h3 className="text-xl font-bold tracking-tight text-white drop-shadow-md">微观生态</h3>
                 <p className="text-xs uppercase tracking-widest text-white/60 mt-1">SOTD . OBSERVATORY</p>
              </div>
            </div>
          </div>

          {/* 右侧：文案与交互 */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* 标签 */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-5 py-2 text-xs font-bold uppercase tracking-widest text-primary/80 mb-8 shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping object-cover absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              AI 原生蚂蚁观察平台
            </div>

            {/* 主标题 */}
            <h1 className="text-7xl sm:text-[7rem] lg:text-[8.5rem] font-black tracking-tighter leading-[0.9] text-foreground/90 lg:-ml-2 mb-6 drop-shadow-xl flex flex-col gap-2">
              <span>蚁<span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent-warm/70">域.</span></span>
            </h1>

            {/* 副标题 */}
            <p className="mt-2 text-xl sm:text-2xl text-muted-foreground/80 font-light tracking-wide max-w-lg">
              数字显微镜下的微观帝国
              <span className="block mt-4 text-sm font-medium text-muted-foreground/50 tracking-widest uppercase">查资料 · 学阶段 · 记成长</span>
            </p>

            {/* CTA 按钮组 */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-start gap-5">
              <Link
                href="/species"
                className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-primary px-8 py-4 font-bold text-primary-foreground shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-primary/30"
              >
                <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-150%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(150%)]">
                  <div className="relative h-full w-8 bg-white/20" />
                </div>
                开始探索
                <IconArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/colonies/new"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-8 py-4 font-bold text-foreground/80 transition-all duration-300 hover:bg-white/10 hover:text-foreground hover:scale-105 shadow-inner"
              >
                创建档案
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====== 功能入口卡片 ====== */}
      <section className="container mx-auto px-4 pb-24 relative z-20">
        <div className="grid gap-6 sm:grid-cols-3 max-w-5xl mx-auto">
          {/* 资料库 */}
          <Link
            href="/species"
            className="group relative rounded-3xl border border-white/5 bg-card/20 backdrop-blur-xl p-8 sm:p-10 overflow-hidden transition-all duration-500 hover:bg-card/40 hover:-translate-y-2 hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)]"
          >
            {/* 微光特效 */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-primary flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <IconBook className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-foreground/90 group-hover:text-primary transition-colors">资料库</h2>
            <p className="mt-3 text-sm text-muted-foreground/60 leading-relaxed font-light">
              浏览蚁亚科物种资料，了解饲养方法与生态习性
            </p>
          </Link>

          {/* 生活史 */}
          <Link
            href="/lifecycle"
            className="group relative rounded-3xl border border-white/5 bg-card/20 backdrop-blur-xl p-8 sm:p-10 overflow-hidden transition-all duration-500 hover:bg-card/40 hover:-translate-y-2 hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)]"
          >
             <div className="absolute inset-0 bg-gradient-to-br from-nature-green/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-nature-green flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <IconCycle className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-foreground/90 group-hover:text-nature-green transition-colors">生活史</h2>
            <p className="mt-3 text-sm text-muted-foreground/60 leading-relaxed font-light">
              了解蚂蚁从婚飞到成熟的完整生命历程
            </p>
          </Link>

          {/* 我的蚁群 */}
          <Link
            href="/colonies"
            className="group relative rounded-3xl border border-white/5 bg-card/20 backdrop-blur-xl p-8 sm:p-10 overflow-hidden transition-all duration-500 hover:bg-card/40 hover:-translate-y-2 hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent-warm/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-accent-warm flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <IconAnt className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-foreground/90 group-hover:text-accent-warm transition-colors">我的蚁群</h2>
            <p className="mt-3 text-sm text-muted-foreground/60 leading-relaxed font-light">
              创建蚁群档案，记录成长过程，AI 辅助分析
            </p>
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedSpecies.map((sp, i) => (
              <Link
                key={sp.id}
                href={`/species/${sp.id}`}
                className="group block relative overflow-hidden rounded-3xl border border-white/5 bg-card/20 backdrop-blur-xl p-6 sm:p-7 shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-primary/20 hover:bg-card/40"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* 卡片高光 sweep */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[150%] skew-x-[-30deg] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />

                 {/* 右上角光晕 */}
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px] -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-foreground/90 group-hover:text-primary transition-colors duration-300 tracking-tight">
                        {sp.name_cn}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground/60 mt-1 italic font-light tracking-wide">
                        {sp.name_lat}
                      </p>
                    </div>
                    {sp.beginner_friendly && (
                      <span className="rounded-full bg-nature-green/10 text-nature-green ring-1 ring-nature-green/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shadow-inner flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-nature-green animate-pulse" />
                        推荐
                      </span>
                    )}
                  </div>
                  
                  {sp.summary ? (
                    <p className="text-sm line-clamp-3 text-muted-foreground/80 leading-relaxed font-light mt-2 mb-6 flex-grow">
                      {sp.summary}
                    </p>
                  ) : (
                    <div className="flex-grow mb-6 pt-2">
                       <div className="w-12 h-0.5 bg-muted-foreground/20 rounded-full" />
                    </div>
                  )}

                  <div className="pt-4 border-t border-white/5 flex gap-2 flex-wrap text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mt-auto">
                    <span className="bg-background/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/5 group-hover:text-primary transition-colors flex items-center gap-1">
                      {sp.genus_cn}
                      <IconArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-5px] group-hover:translate-x-0" />
                    </span>
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
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-6 py-2.5 text-sm font-bold text-foreground/80"
          >
            查看全部新手推荐 <IconArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
