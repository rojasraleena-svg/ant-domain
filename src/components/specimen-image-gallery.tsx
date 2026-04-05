"use client";

import Image from "next/image";
import { useState, useCallback } from "react";

export interface SpecimenImageData {
  id: number;
  url: string;
  thumbnail_url: string | null;
  view_type: string;
  is_primary: boolean;
  photographer: string | null;
  license: string | null;
  country: string | null;
}

const VIEW_TYPE_LABELS: Record<string, string> = {
  dorsal: "背视图",
  lateral: "侧视图",
  frontal: "正面图",
  habitat: "生境照",
  other: "其他",
};

export function SpecimenImageGallery({
  images,
}: {
  images: SpecimenImageData[];
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images || images.length === 0) return null;

  const selected = images[selectedIdx];

  const handleThumbClick = useCallback((idx: number) => {
    setSelectedIdx(idx);
  }, []);

  const openLightbox = useCallback(() => setLightboxOpen(true), []);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  const prevImage = useCallback(
    () => setSelectedIdx((i) => (i - 1 + images.length) % images.length),
    [images.length]
  );
  const nextImage = useCallback(
    () => setSelectedIdx((i) => (i + 1) % images.length),
    [images.length]
  );

  return (
    <section className="mb-8 rounded-lg border bg-card p-6">
      <h2 className="font-semibold text-lg mb-4">标本图像</h2>

      {/* 主图区域 */}
      <div
        className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted cursor-zoom-in"
        onClick={openLightbox}
        onKeyDown={(e) => e.key === "Enter" && openLightbox()}
        role="button"
        tabIndex={0}
        aria-label={`查看${VIEW_TYPE_LABELS[selected.view_type] || "标本"}大图`}
      >
        <Image
          src={selected.url}
          alt={`${VIEW_TYPE_LABELS[selected.view_type] || "标本"}图像 - ${selected.photographer || ""}`}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 768px, 832px"
          priority={selected.is_primary}
        />

        {/* 视角标签 */}
        <span className="absolute top-3 right-3 rounded-full bg-black/50 text-white text-xs px-2.5 py-1 backdrop-blur-sm">
          {VIEW_TYPE_LABELS[selected.view_type] || selected.view_type}
        </span>

        {/* 拍摄信息叠加层 */}
        {(selected.photographer || selected.country) && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-2">
            <p className="text-xs text-white/90">
              {selected.photographer && <span>拍摄：{selected.photographer}</span>}
              {selected.photographer && selected.country && (
                <span className="mx-2">·</span>
              )}
              {selected.country && <span>{selected.country}</span>}
            </p>
          </div>
        )}
      </div>

      {/* 缩略图条 */}
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => handleThumbClick(idx)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                idx === selectedIdx
                  ? "border-primary shadow-sm"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
              aria-label={`切换到第 ${idx + 1} 张图像`}
              aria-pressed={idx === selectedIdx}
            >
              <Image
                src={img.thumbnail_url || img.url}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* 许可证 */}
      {selected.license && (
        <p className="mt-2 text-xs text-muted-foreground">
          许可证：
          <a
            href={selected.license}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground ml-1"
          >
            查看许可
          </a>
        </p>
      )}

      {/* 灯箱预览 */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeLightbox()}
          role="dialog"
          aria-modal="true"
          aria-label="图像预览"
        >
          {/* 关闭按钮 */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors"
            aria-label="关闭预览"
          >
            ✕
          </button>

          {/* 左右切换 */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-3xl z-10 w-12 h-12 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors"
                aria-label="上一张"
              >
                &#8249;
              </button>
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-3xl z-10 w-12 h-12 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors"
                aria-label="下一张"
              >
                &#8250;
              </button>
            </>
          )}

          {/* 大图 */}
          <div className="relative max-w-[90vw] max-h-[85vh]">
            <Image
              src={images[selectedIdx].url}
              alt="放大预览"
              width={1200}
              height={900}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              priority
            />
          </div>

          {/* 计数器 */}
          {images.length > 1 && (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {selectedIdx + 1} / {images.length}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
