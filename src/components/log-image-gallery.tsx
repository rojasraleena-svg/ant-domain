"use client";

import { useState, useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

// ---- 类型 ----

export interface LogImageData {
  url: string;
  alt?: string;
}

interface LogImageGalleryProps {
  images: LogImageData[];
  /** 日志日期（用于分组标题） */
  logDate?: string;
  logTitle?: string;
}

function Img({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} loading="lazy" />
  );
}

// ---- 组件 ----

export function LogImageGallery({ images, logDate, logTitle }: LogImageGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setSelectedIdx(0);
    setLightboxOpen(false);
  }, [images]);

  if (!images || images.length === 0) return null;

  const selected = images[selectedIdx];

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

  // 键盘导航
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") prevImage();
      else if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, closeLightbox, prevImage, nextImage]);

  return (
    <section className="rounded-2xl border border-white/10 bg-card/10 backdrop-blur-md p-5 overflow-hidden">
      {/* 标题栏 */}
      {(logDate || logTitle) && (
        <div className="flex items-center gap-2 mb-3">
          {logDate && (
            <span className="text-[10px] font-mono text-muted-foreground/50 tracking-wider">
              {logDate}
            </span>
          )}
          {logTitle && (
            <span className="text-xs text-foreground/80 font-medium truncate">
              {logTitle}
            </span>
          )}
          <span className="text-[9px] text-primary/60 ml-auto">
            {images.length} 张影像
          </span>
        </div>
      )}

      {/* 主图区域 */}
      <div
        className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black/30 cursor-zoom-in"
        onClick={openLightbox}
        onKeyDown={(e) => e.key === "Enter" && openLightbox()}
        role="button"
        tabIndex={0}
        aria-label="查看大图"
      >
        <Img
          src={selected.url}
          alt={selected.alt || `观测影像 ${selectedIdx + 1}`}
          className="absolute inset-0 w-full h-full object-contain"
        />
      </div>

      {/* 缩略图条（多图时显示） */}
      {images.length > 1 && (
        <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={`${img.url}-${idx}`}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                idx === selectedIdx
                  ? "border-primary shadow-sm"
                  : "border-transparent opacity-50 hover:opacity-100"
              }`}
              aria-label={`切换到第 ${idx + 1} 张`}
            >
              <Img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* 灯箱预览 */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeLightbox()}
          role="dialog"
          aria-modal="true"
          aria-label="影像预览"
        >
          {/* 关闭按钮 */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/60 hover:text-white z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors"
            aria-label="关闭预览"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 左右切换 */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white z-10 w-11 h-11 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors"
                aria-label="上一张"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white z-10 w-11 h-11 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors"
                aria-label="下一张"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* 大图 */}
          <div className="relative max-w-[90vw] max-h-[85vh]">
            <Img
              src={images[selectedIdx].url}
              alt="放大预览"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>

          {/* 计数器 */}
          {images.length > 1 && (
            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/50 text-sm font-mono">
              {String(selectedIdx + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
