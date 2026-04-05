import Link from "next/link";

export const metadata = {
  title: "资料库",
  description: "蚁亚科蚂蚁物种资料库",
};

export default function SpeciesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">资料库</h1>
        <p className="mt-2 text-muted-foreground">
          蚁亚科（Formicinae）物种资料 · MVP 阶段
        </p>
      </div>

      {/* 搜索栏 */}
      <div className="mb-6">
        <input
          type="search"
          placeholder="搜索物种中文名 / 学名 / 属名..."
          className="w-full max-w-md rounded-lg border bg-background px-4 py-2 text-sm"
        />
      </div>

      {/* 筛选标签 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["全部", "新手推荐", "无需冬眠", "弓背蚁属", "多刺蚁属"].map(
          (tag) => (
            <button
              key={tag}
              className="rounded-full border px-3 py-1 text-sm transition-colors hover:bg-accent"
            >
              {tag}
            </button>
          )
        )}
      </div>

      {/* 物种列表 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* TODO: 从 Supabase 加载 species 数据 */}
        <Link
          href="/species/1"
          className="group rounded-lg border bg-card p-5 transition-colors hover:bg-accent"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold group-hover:text-primary transition-colors">
                日本弓背蚁
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Camponotus japonicus
              </p>
            </div>
            <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs">
              新手友好
            </span>
          </div>
          <p className="mt-2 text-sm line-clamp-2">
            国内最常见的入门饲养弓背蚁种类之一，分布广泛，适应性强。
          </p>
          <div className="mt-3 flex gap-2 text-xs text-muted-foreground">
            <span>弓背蚁属</span>
            <span>·</span>
            <span>24-28°C</span>
            <span>·</span>
            <span>需要冬眠</span>
          </div>
        </Link>

        <Link
          href="/species/2"
          className="group rounded-lg border bg-card p-5 transition-colors hover:bg-accent"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold group-hover:text-primary transition-colors">
                尼科巴弓背蚁
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Camponotus nicobarensis
              </p>
            </div>
            <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs">
              新手友好
            </span>
          </div>
          <p className="mt-2 text-sm line-clamp-2">
            热门热带弓背蚁，生长速度快，体色美观，全年活跃无需冬眠。
          </p>
          <div className="mt-3 flex gap-2 text-xs text-muted-foreground">
            <span>弓背蚁属</span>
            <span>·</span>
            <span>26-30°C</span>
            <span>·</span>
            <span>无需冬眠</span>
          </div>
        </Link>

        <Link
          href="/species/7"
          className="group rounded-lg border bg-card p-5 transition-colors hover:bg-accent"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold group-hover:text-primary transition-colors">
                拟黑多刺蚁
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Polyrhachis dives
              </p>
            </div>
            <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs">
              新手友好
            </span>
          </div>
          <p className="mt-2 text-sm line-clamp-2">
            国产最经典的入门蚂蚁之一，外形独特有金属光泽，繁殖速度快。
          </p>
          <div className="mt-3 flex gap-2 text-xs text-muted-foreground">
            <span>多刺蚁属</span>
            <span>·</span>
            <span>25-28°C</span>
            <span>·</span>
            <span>无需冬眠</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
