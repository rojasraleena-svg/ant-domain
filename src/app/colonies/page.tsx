import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStageLabel } from "@/lib/labels";
import { DeleteColonyButton } from "./components/DeleteColonyButton";

export const metadata = {
  title: "我的蚁群",
  description: "管理和记录你的蚁群成长",
};

export default async function ColoniesPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const { data: colonies } = await db
    .from("colonies")
    .select(
      "*, species(id, name_cn, name_lat, genus_cn, cover_image)"
    )
    .eq("user_id", user.id)
    .eq("status", 1)
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      {/* 页面头部 */}
      <div className="mb-14 relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-4 inline-block bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground">
            我的群落
          </h1>
          <p className="text-muted-foreground/80 text-lg sm:text-xl font-light tracking-wide max-w-xl">
            沉浸式观测记录，追踪每一个群落的微型生态演化轨迹。
          </p>
        </div>
        <Link
          href="/colonies/new"
          className="group relative inline-flex items-center gap-2 rounded-2xl bg-white/5 backdrop-blur-md px-6 py-3.5 text-sm font-bold text-foreground border border-white/10 hover:border-primary/50 hover:bg-primary/20 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(255,100,50,0.2)] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 group-hover:translate-x-full duration-1000 transition-transform"></div>
          <svg className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="relative z-10">新建生态档案</span>
        </Link>
      </div>

      {/* 蚁群列表 */}
      {!colonies || colonies.length === 0 ? (
        <div className="rounded-[2.5rem] border border-white/10 p-16 sm:p-24 text-center relative overflow-hidden bg-card/20 backdrop-blur-xl group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          {/* 星云光晕背景 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30vw] h-[30vw] min-w-[300px] min-h-[300px] bg-primary/20 rounded-full blur-[80px] opacity-0 group-hover:opacity-50 transition-opacity duration-1000" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner animate-pulse-slow">
              <svg className="w-10 h-10 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground/90 mb-3 tracking-tight">培养皿空空如也</h2>
            <p className="text-muted-foreground/60 mb-8 max-w-sm text-center font-light">
              是时候引入你的第一个物种了。创建生态档案，开始记录这颗微缩星球的繁荣。
            </p>
            <Link
              href="/colonies/new"
              className="inline-flex items-center gap-2 rounded-xl bg-primary/20 border border-primary/30 px-6 py-3 text-sm font-bold text-primary shadow-[0_0_20px_rgba(255,100,50,0.1)] hover:bg-primary/30 hover:shadow-[0_0_30px_rgba(255,100,50,0.2)] transition-all duration-300 hover:-translate-y-1"
            >
              启动初代协议
              <svg className="w-4 h-4 ml-1 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-animate">
          {colonies.map((colony, i) => (
            <div
              key={colony.id}
              className="group relative rounded-3xl border border-white/10 bg-card/20 backdrop-blur-md p-6 overflow-hidden transition-all duration-500 hover:bg-card/40 hover:-translate-y-2 hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] fade-in-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* 微光特效 */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <div className="absolute -inset-px rounded-3xl border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px] -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              {/* 卡片内容区 */}
              <div className="relative z-10 flex flex-col h-full">
                {/* 顶部：删除与状态 */}
                <div className="flex justify-between items-start mb-4">
                  <div className="px-2.5 py-1 flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-muted-foreground/80 shadow-inner group-hover:text-primary group-hover:border-primary/30 group-hover:bg-primary/10 transition-colors">
                    ID // {String(colony.id).split('-')[0]}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 -mr-2 -mt-2">
                     <DeleteColonyButton colonyId={colony.id} colonyName={colony.name} />
                  </div>
                </div>

                <Link href={`/colonies/${colony.id}`} className="flex-1 flex flex-col">
                  {/* 中部：标题与物种 */}
                  <div className="mb-6 flex-1">
                    <h3 className="text-2xl font-black tracking-tight text-foreground/90 group-hover:text-white transition-colors duration-300 mb-1 line-clamp-2">
                      {colony.name}
                    </h3>
                    <p className="text-sm text-primary/70 font-medium italic tracking-wide">
                      {colony.species?.name_cn || "未知物种"} <span className="text-muted-foreground/40 font-light text-xs ml-1 block mt-0.5">{colony.species?.name_lat || "Species incognita"}</span>
                    </p>
                  </div>

                  {/* 底部：指标数据 */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-1">规模</span>
                      <span className="text-sm font-semibold text-foreground/80">{colony.worker_range || "未知"} <span className="text-xs text-muted-foreground/60 font-normal">工蚁</span></span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-1">阶段</span>
                      <span className="text-sm font-semibold text-foreground/80">
                        {colony.current_stage ? getStageLabel(colony.current_stage) : "观测中..."}
                      </span>
                    </div>
                    <div className="col-span-2 flex flex-col mt-1">
                       <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-1">建立日期</span>
                       <span className="text-xs font-mono text-muted-foreground/70">{new Date(colony.founded_date).toLocaleDateString("zh-CN").replace(/\//g, '.')}</span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
