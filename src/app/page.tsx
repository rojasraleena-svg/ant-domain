import Link from "next/link";

export default function HomePage() {
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" id="recommended-species">
          {/* TODO: 从数据库加载推荐物种 */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">日本弓背蚁</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Camponotus japonicus · 新手推荐
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">尼科巴弓背蚁</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Camponotus nicobarensis · 无需冬眠
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">拟黑多刺蚁</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Polyrhachis dives · 国产经典入门种
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
