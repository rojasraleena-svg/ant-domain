"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Image,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Sparkles,
  Grid3X3,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";

interface GalleryImage {
  id: number;
  species_id: number;
  url: string;
  thumbnail_url: string | null;
  prompt: string;
  model: string;
  view_type: string | null;
  style: string | null;
  caste: string | null;
  is_featured: boolean;
  created_at: string;
  species?: { name_cn: string; name_lat: string };
}

const STYLE_MAP: Record<string, string> = {
  scientific: "科学插图",
  macro_photo: "微距摄影",
  watercolor: "手绘水彩",
  realistic: "写实数字画",
};

const VIEW_MAP: Record<string, string> = {
  dorsal: "背视图",
  lateral: "侧视图",
  frontal: "头面部",
  habitat: "生态环境",
};

const CASTE_MAP: Record<string, string> = {
  worker: "工蚁",
  queen: "蚁后",
  soldier: "兵蚁",
  male: "雄蚁",
};

const STYLE_OPTIONS = [
  { value: "all", label: "全部风格" },
  { value: "scientific", label: "科学插图" },
  { value: "macro_photo", label: "微距摄影" },
  { value: "watercolor", label: "手绘水彩" },
  { value: "realistic", label: "写实数字画" },
];

const PAGE_SIZE = 30;

function GalleryContent() {
  const searchParams = useSearchParams();
  const urlSpeciesId = searchParams.get("speciesId");

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStyle, setFilterStyle] = useState("all");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [gridCols, setGridCols] = useState<4 | 5 | 6>(5);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (filterStyle !== "all") params.set("style", filterStyle);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (showFeaturedOnly) params.set("featured", "true");
      if (urlSpeciesId) params.set("speciesId", urlSpeciesId);

      const res = await fetch(`/api/gallery?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setImages((data.images || []) as GalleryImage[]);
      setTotal(data.total || 0);
    } catch {
      // 静默失败
    } finally {
      setLoading(false);
    }
  }, [page, filterStyle, searchQuery, showFeaturedOnly, urlSpeciesId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  /** 上海时区格式化 */
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const offset = 8 * 60 * 60 * 1000;
    const shanghai = new Date(d.getTime() + offset + d.getTimezoneOffset() * 60 * 1000);
    return shanghai.toLocaleDateString("zh-CN");
  };

  const gridClass =
    gridCols === 4
      ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
      : gridCols === 5
        ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
        : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5";

  return (
    <div className="min-h-screen">
      {/* Hero 区域 */}
      <section className="relative overflow-hidden border-b border-white/[0.04]">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-[40%] h-[40%] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />
        <div className="container mx-auto px-4 py-16 sm:py-20 relative">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl bg-primary/10 p-2.5 ring-1 ring-primary/20">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                AI Art Gallery
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground/90">
              {urlSpeciesId && images[0]?.species
                ? `${images[0].species.name_cn} · 插图`
                : <>蚁域<span className="text-primary/70">插画馆</span></>}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground font-light leading-relaxed max-w-xl">
              {urlSpeciesId && images[0]?.species
                ? `${images[0].species.name_lat} 的 AI 生成插图`
                : "由 AI 生成的蚂蚁物种插图合集，涵盖科学插图、微距摄影、水彩与数字艺术等多种风格"}
            </p>
            <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Image className="w-4 h-4" />
                共 <strong className="text-foreground tabular-nums">{total.toLocaleString()}</strong> 张
              </span>
              <span className="text-white/10">|</span>
              <span>{total > 0 ? `覆盖 ${new Set(images.map((i) => i.species_id)).size} 个物种` : ""}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 主内容 */}
      <div className="container mx-auto px-4 py-8">
        {/* 工具栏 */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                showFilters || filterStyle !== "all" || searchQuery
                  ? "border-primary/40 bg-primary/8 text-primary"
                  : "border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20"
              }`}
            >
              <Filter className="w-4 h-4" />
              筛选
            </button>

            <button
              onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                showFeaturedOnly
                  ? "border-yellow-500/40 bg-yellow-500/8 text-yellow-500"
                  : "border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              精选
            </button>
          </div>

          {/* 密度切换 */}
          <div className="flex items-center gap-1 rounded-lg border border-white/10 p-0.5">
            {[4, 5, 6].map((cols) => (
              <button
                key={cols}
                onClick={() => setGridCols(cols as 4 | 5 | 6)}
                className={`rounded-md p-1.5 transition-colors ${
                  gridCols === cols
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={`${cols}列`}
              >
                <LayoutGrid className={`w-3.5 h-3.5 ${cols === 6 ? "-scale-90" : ""}`} />
              </button>
            ))}
          </div>
        </div>

        {/* 筛选栏展开 */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-card p-4 animate-[fadeInUp_0.2s_ease-out] mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="搜索物种名..."
                className="w-full rounded-lg border border-white/10 bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>

            <select
              value={filterStyle}
              onChange={(e) => {
                setFilterStyle(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-white/10 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              {STYLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {(searchQuery || filterStyle !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterStyle("all");
                  setPage(1);
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                清除筛选
              </button>
            )}
          </div>
        )}

        {/* 图片网格 */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : images.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-card/50 p-16 text-center">
            <Image className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">暂无图片</p>
            <p className="mt-2 text-xs text-muted-foreground/50">
              快去物种详情页生成第一张 AI 插图吧
            </p>
            <Link
              href="/species"
              className="inline-flex mt-4 items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              浏览物种资料库
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <>
            <div className={gridClass}>
              {images.map((img) => (
                <div
                  key={img.id}
                  className={`group relative rounded-lg overflow-hidden border bg-card aspect-square cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-black/10 ${
                    img.is_featured
                      ? "border-yellow-500/25 ring-1 ring-yellow-500/15"
                      : "border-white/[0.06]"
                  }`}
                  onClick={() => setSelectedImage(img)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.thumbnail_url || img.url}
                    alt={`${img.species?.name_cn || ""} AI 插图`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* 封面标记 */}
                  {img.is_featured && (
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 rounded-full bg-yellow-500/90 px-1.5 py-0.5 text-[9px] text-yellow-900 font-medium shadow-sm">
                      <Sparkles className="w-2.5 h-2.5 fill-current" />
                      精选
                    </div>
                  )}

                  {/* 参数标签 */}
                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {img.style && (
                      <span className="rounded bg-black/60 px-1 py-0.5 text-[8px] text-white backdrop-blur-sm">
                        {STYLE_MAP[img.style] || img.style}
                      </span>
                    )}
                  </div>

                  {/* 底部信息 */}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[11px] text-white font-medium truncate">
                      {img.species?.name_cn || "未知"}
                    </p>
                    <p className="text-[9px] text-white/60 italic">
                      {img.species?.name_lat || ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 rounded-lg border border-white/10 px-4 py-2 text-sm disabled:opacity-40 hover:border-white/20 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  上一页
                </button>
                <span className="text-sm text-muted-foreground">
                  第 <strong className="text-foreground">{page}</strong> / {totalPages} 页
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 rounded-lg border border-white/10 px-4 py-2 text-sm disabled:opacity-40 hover:border-white/20 transition-colors"
                >
                  下一页
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 详情弹窗 */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-3xl w-full rounded-xl border border-white/10 bg-card overflow-hidden shadow-2xl animate-[scaleIn_0.15s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 z-10 rounded-full bg-black/50 p-1.5 hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <div className="flex flex-col md:flex-row">
              {/* 图片预览 */}
              <div className="md:w-1/2 bg-black/20 flex items-center justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImage.url}
                  alt={`${selectedImage.species?.name_cn || ""} 插图`}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                />
              </div>

              {/* 详情信息 */}
              <div className="md:w-1/2 p-5 space-y-4">
                {/* 物种名称 + 链接 */}
                <div>
                  <h3 className="text-lg font-bold">
                    {selectedImage.species?.name_cn || "未知物种"}
                  </h3>
                  <p className="text-sm italic text-muted-foreground">
                    {selectedImage.species?.name_lat || ""}
                  </p>
                  {selectedImage.species_id && (
                    <Link
                      href={`/species/${selectedImage.species_id}`}
                      className="inline-flex items-center gap-1 mt-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      查看物种详情
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {/* 参数网格 */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-background/50 p-3 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      风格
                    </span>
                    <p className="font-medium">
                      {selectedImage.style
                        ? STYLE_MAP[selectedImage.style] || selectedImage.style
                        : "-"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-background/50 p-3 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      视角
                    </span>
                    <p className="font-medium">
                      {selectedImage.view_type
                        ? VIEW_MAP[selectedImage.view_type] ||
                          selectedImage.view_type
                        : "-"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-background/50 p-3 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      角色
                    </span>
                    <p className="font-medium">
                      {selectedImage.caste
                        ? CASTE_MAP[selectedImage.caste] ||
                          selectedImage.caste
                        : "-"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-background/50 p-3 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      模型
                    </span>
                    <p className="font-medium text-xs">{selectedImage.model}</p>
                  </div>
                </div>

                {/* Prompt */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    提示词
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed bg-background/50 rounded-lg p-3 font-mono break-all line-clamp-6">
                    {selectedImage.prompt}
                  </p>
                </div>

                {/* 时间 */}
                <p className="text-[11px] text-muted-foreground">
                  生成于 {formatTime(selectedImage.created_at)}

                  {selectedImage.is_featured && (
                    <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-yellow-500/10 px-1.5 py-0.5 text-[10px] text-yellow-500">
                      <Sparkles className="w-2.5 h-2.5" />
                      精选作品
                    </span>
                  )}
                </p>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2">
                  <a
                    href={selectedImage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    查看原图
                  </a>
                  {selectedImage.species_id && (
                    <Link
                      href={`/species/${selectedImage.species_id}`}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                    >
                      物种详情
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <GalleryContent />
    </Suspense>
  );
}
