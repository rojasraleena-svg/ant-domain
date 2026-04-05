import Link from "next/link";
import { notFound } from "next/navigation";
import { getSpeciesById, getSpecimenImages } from "@/lib/public-data";
import { getDietLabel, getNestTypeLabel } from "@/lib/labels";
import { SpecimenImageGallery } from "@/components/specimen-image-gallery";
import { ImageGenerator } from "@/components/image-generator";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const sp = await getSpeciesById(parseInt(id, 10));
    return {
      title: `${sp.name_cn} - ${sp.name_lat}`,
      description: sp.summary || `蚁域物种资料 - ${sp.name_cn}`,
    };
  } catch {
    return { title: "物种详情", description: "蚁域" };
  }
}

const difficultyLabels: Record<number, string> = {
  1: "低",
  2: "中",
  3: "高",
};

const difficultyColors: Record<number, string> = {
  1: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  2: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  3: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export default async function SpeciesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let sp;
  let images = [];
  try {
    sp = await getSpeciesById(parseInt(id, 10));
    images = await getSpecimenImages(sp.id);
  } catch {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/species" className="hover:text-foreground">
          资料库
        </Link>{" "}
        {"->"} {sp.name_cn}
      </nav>

      <div className="mb-8">
        <div className="flex items-start gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">{sp.name_cn}</h1>
            <p className="mt-1 text-lg italic text-muted-foreground">{sp.name_lat}</p>
          </div>
          <div className="flex gap-2 ml-auto">
            {sp.beginner_friendly && (
              <span className="rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-3 py-1 text-sm">
                新手友好
              </span>
            )}
            <span
              className={`rounded-full px-3 py-1 text-sm ${
                difficultyColors[sp.difficulty] || ""
              }`}
            >
              难度：{difficultyLabels[sp.difficulty] || sp.difficulty}
            </span>
          </div>
        </div>

        <div className="mt-4 flex gap-2 text-sm text-muted-foreground flex-wrap">
          <span>{sp.subfamily_cn || sp.subfamily}</span>
          <span>{">"}</span>
          <span>{sp.genus_cn || sp.genus}</span>
          <span>{">"}</span>
          <span className="text-foreground font-medium">{sp.name_cn}</span>
        </div>
      </div>

      {/* 标本图像画廊 */}
      {images.length > 0 && <SpecimenImageGallery images={images} />}

      {/* AI 插图生成 */}
      <section className="mb-8">
        <ImageGenerator nameCn={sp.name_cn} nameLat={sp.name_lat} />
      </section>

      <section className="mb-8 rounded-lg border bg-card p-6">
        <h2 className="font-semibold text-lg mb-4">基本信息</h2>
        {sp.summary && (
          <p className="text-muted-foreground leading-relaxed">{sp.summary}</p>
        )}
        {sp.description && (
          <div className="mt-4 prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{sp.description}</p>
          </div>
        )}
      </section>

      {(sp.worker_size || sp.queen_size || sp.body_color || sp.key_features) && (
        <section className="mb-8 rounded-lg border bg-card p-6">
          <h2 className="font-semibold text-lg mb-4">形态特征</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {sp.worker_size && (
              <div>
                <span className="text-sm text-muted-foreground">工蚁体长</span>
                <p className="font-medium">{sp.worker_size}</p>
              </div>
            )}
            {sp.queen_size && (
              <div>
                <span className="text-sm text-muted-foreground">蚁后体长</span>
                <p className="font-medium">{sp.queen_size}</p>
              </div>
            )}
            {sp.body_color && (
              <div>
                <span className="text-sm text-muted-foreground">体色</span>
                <p className="font-medium">{sp.body_color}</p>
              </div>
            )}
            {sp.key_features && (
              <div className="sm:col-span-2">
                <span className="text-sm text-muted-foreground">关键识别特征</span>
                <p className="font-medium mt-1">{sp.key_features}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {(sp.temp_min || sp.humidity_min || sp.diet_type || sp.nest_type) && (
        <section className="mb-8 rounded-lg border bg-card p-6">
          <h2 className="font-semibold text-lg mb-4">饲养信息</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(sp.temp_min || sp.temp_max || sp.temp_optimal) && (
              <div>
                <span className="text-sm text-muted-foreground">推荐温度</span>
                <p className="font-medium">
                  {sp.temp_optimal || `${sp.temp_min}-${sp.temp_max}`}°C
                </p>
              </div>
            )}
            {(sp.humidity_min || sp.humidity_max || sp.humidity_optimal) && (
              <div>
                <span className="text-sm text-muted-foreground">推荐湿度</span>
                <p className="font-medium">
                  {sp.humidity_optimal || `${sp.humidity_min}-${sp.humidity_max}`}%
                </p>
              </div>
            )}
            {sp.diet_type && (
              <div>
                <span className="text-sm text-muted-foreground">食性</span>
                <p className="font-medium">{getDietLabel(sp.diet_type)}</p>
              </div>
            )}
            {sp.nest_type && (
              <div>
                <span className="text-sm text-muted-foreground">巢型建议</span>
                <p className="font-medium">{getNestTypeLabel(sp.nest_type)}</p>
              </div>
            )}
            {sp.need_hibernation !== undefined && (
              <div>
                <span className="text-sm text-muted-foreground">冬眠需求</span>
                <p className="font-medium">
                  {sp.need_hibernation ? "需要冬眠" : "无需冬眠"}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {(sp.distribution || sp.habitat || sp.flight_season) && (
        <section className="mb-8 rounded-lg border bg-card p-6">
          <h2 className="font-semibold text-lg mb-4">分布与生态</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sp.distribution && (
              <div className="sm:col-span-2">
                <span className="text-sm text-muted-foreground">分布区域</span>
                <p className="font-medium mt-1">{sp.distribution}</p>
              </div>
            )}
            {sp.habitat && (
              <div>
                <span className="text-sm text-muted-foreground">生活环境</span>
                <p className="font-medium mt-1">{sp.habitat}</p>
              </div>
            )}
            {sp.flight_season && (
              <div>
                <span className="text-sm text-muted-foreground">婚飞季节</span>
                <p className="font-medium mt-1">{sp.flight_season}</p>
              </div>
            )}
            {sp.flight_time && (
              <div>
                <span className="text-sm text-muted-foreground">婚飞时间</span>
                <p className="font-medium mt-1">{sp.flight_time}</p>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="mb-8 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">查看生活史</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              了解{sp.genus_cn || sp.genus}从婚飞到成熟的完整生命历程
            </p>
          </div>
          <Link
            href={`/lifecycle?genus=${sp.genus}`}
            className="rounded-lg bg-primary px-5 py-2 text-sm text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
          >
            查看生活史 {"->"}
          </Link>
        </div>
      </section>
    </div>
  );
}
