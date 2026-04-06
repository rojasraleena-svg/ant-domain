"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Image,
  Search,
  Star,
  Trash2,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
} from "lucide-react";

interface AdminImage {
  id: number;
  species_id: number;
  url: string;
  prompt: string;
  model: string;
  view_type: string | null;
  style: string | null;
  caste: string | null;
  is_featured: boolean;
  created_at: string;
  species?: { name_cn: string; name_lat: string };
  users?: { username: string };
  creatorUsername?: string | null;
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

const PAGE_SIZE = 30;

export default function AdminImagesPage() {
  const [images, setImages] = useState<AdminImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // 筛选
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStyle, setFilterStyle] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // 详情弹窗
  const [selectedImage, setSelectedImage] = useState<AdminImage | null>(null);

  // 操作状态
  const [actionId, setActionId] = useState<number | null>(null);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (filterStyle !== "all") params.set("style", filterStyle);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/images?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setImages((data.images || []) as AdminImage[]);
      setTotal(data.total || 0);
    } catch {
      // 静默失败
    } finally {
      setLoading(false);
    }
  }, [page, filterStyle, searchQuery]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleToggleFeatured = async (img: AdminImage) => {
    setActionId(img.id);
    try {
      const res = await fetch("/api/admin/images", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: img.id, is_featured: !img.is_featured }),
      });

      if (!res.ok) throw new Error();

      setImages((prev) =>
        prev.map((i) =>
          i.id === img.id ? { ...i, is_featured: !i.is_featured } : i
        )
      );

      if (selectedImage?.id === img.id) {
        setSelectedImage({ ...selectedImage, is_featured: !selectedImage.is_featured });
      }
    } catch {
      // 静默失败
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (img: AdminImage) => {
    if (!confirm(`确定删除这张图片吗？\n物种：${img.species?.name_cn || "未知"}`)) return;

    setActionId(img.id);
    try {
      const res = await fetch("/api/admin/images", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: img.id, status: 0 }),
      });

      if (!res.ok) throw new Error();

      setImages((prev) => prev.filter((i) => i.id !== img.id));
      setSelectedImage(null);
      setTotal((t) => t - 1);
    } catch {
      // 静默失败
    } finally {
      setActionId(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Image className="w-6 h-6 text-primary" />
            图片管理
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            管理 AI 生成的所有物种插图（共 {total.toLocaleString()} 张）
          </p>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
            showFilters
              ? "border-primary/40 bg-primary/8 text-primary"
              : "border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20"
          }`}
        >
          <Filter className="w-4 h-4" />
          筛选
        </button>
      </div>

      {/* 筛选栏 */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-card p-4 animate-[fadeInUp_0.2s_ease-out]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="搜索物种名或提示词..."
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
            <option value="all">全部风格</option>
            <option value="scientific">科学插图</option>
            <option value="macro_photo">微距摄影</option>
            <option value="watercolor">手绘水彩</option>
            <option value="realistic">写实数字画</option>
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
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : images.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-card/50 p-12 text-center">
          <Image className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">暂无图片</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {images.map((img) => (
              <div
                key={img.id}
                className={`group relative rounded-lg overflow-hidden border bg-card aspect-square cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-black/10 ${
                  img.is_featured
                    ? "border-yellow-500/30 ring-1 ring-yellow-500/20"
                    : "border-white/[0.06]"
                }`}
                onClick={() => setSelectedImage(img)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={`${img.species?.name_cn || ""} 插图`}
                  className="w-full h-full object-cover"
                />

                {/* 封面标记 */}
                {img.is_featured && (
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 rounded-full bg-yellow-500/90 px-1.5 py-0.5 text-[9px] text-yellow-900 font-medium shadow-sm">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    封面
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
                  <p className="text-[9px] text-white/60">
                    {new Date(img.created_at).toLocaleDateString("zh-CN")}
                  </p>
                </div>

                {/* 快捷操作 */}
                <div className="absolute top-1/2 right-1 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFeatured(img);
                    }}
                    disabled={actionId === img.id}
                    className="rounded-md p-1.5 bg-black/60 backdrop-blur-sm hover:bg-black/80 transition-colors disabled:opacity-50"
                    title={img.is_featured ? "取消封面" : "设为封面"}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        img.is_featured ? "fill-yellow-400 text-yellow-400" : "text-white"
                      }`}
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(img);
                    }}
                    disabled={actionId === img.id}
                    className="rounded-md p-1.5 bg-red-500/80 backdrop-blur-sm hover:bg-red-600 transition-colors disabled:opacity-50"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-sm disabled:opacity-40 hover:border-white/20 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                上一页
              </button>
              <span className="text-sm text-muted-foreground">
                第 {page} / {totalPages} 页
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-sm disabled:opacity-40 hover:border-white/20 transition-colors"
              >
                下一页
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

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
                <div>
                  <h3 className="text-lg font-bold">
                    {selectedImage.species?.name_cn || "未知物种"}
                  </h3>
                  <p className="text-sm italic text-muted-foreground">
                    {selectedImage.species?.name_lat || ""}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-background/50 p-3 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      模型
                    </span>
                    <p className="font-medium">{selectedImage.model}</p>
                  </div>
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
                        ? CASTE_MAP[selectedImage.caste] || selectedImage.caste
                        : "-"}
                    </p>
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

                {/* 创建者 */}
                {selectedImage.creatorUsername && (
                  <p className="text-[11px] text-muted-foreground">
                    由{" "}
                    <span className="font-medium text-foreground/80">
                      {selectedImage.creatorUsername}
                    </span>{" "}生成
                  </p>
                )}

                {/* 时间 */}
                <p className="text-[11px] text-muted-foreground">
                  生成于{" "}
                  {(() => {
                    const d = new Date(selectedImage.created_at);
                    const offset = 8 * 60 * 60 * 1000;
                    const shanghai = new Date(d.getTime() + offset + d.getTimezoneOffset() * 60 * 1000);
                    return shanghai.toLocaleString("zh-CN", { timeZoneName: "short" });
                  })()}
                </p>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleToggleFeatured(selectedImage)}
                    disabled={actionId === selectedImage.id}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      selectedImage.is_featured
                        ? "bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25"
                        : "border border-white/10 text-foreground hover:bg-accent"
                    } disabled:opacity-50`}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        selectedImage.is_featured ? "fill-current" : ""
                      }`}
                    />
                    {selectedImage.is_featured ? "取消封面" : "设为封面"}
                  </button>
                  <a
                    href={selectedImage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    原图
                  </a>
                  <button
                    onClick={() => handleDelete(selectedImage)}
                    disabled={actionId === selectedImage.id}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
