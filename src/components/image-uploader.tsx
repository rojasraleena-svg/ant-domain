"use client";

import { useState, useCallback, useRef } from "react";
import { ImageIcon, X, Upload, Loader2, AlertCircle } from "lucide-react";
import { MAX_FILE_SIZE, MAX_IMAGES_PER_LOG, ALLOWED_TYPES } from "@/lib/image-upload";

// ---- 类型 ----

export interface UploadedImage {
  url: string;
  path: string;
  preview: string;
  fileName: string;
}

interface ImageUploaderProps {
  colonyId: string;
  maxImages?: number;
  onImagesChange?: (images: UploadedImage[]) => void;
}

// ---- 格式化文件大小 ----

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ---- 组件 ----

export function ImageUploader({
  colonyId,
  maxImages = MAX_IMAGES_PER_LOG,
  onImagesChange,
}: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState<string | null>(null); // 正在上传的 preview URL
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const notifyChange = useCallback(
    (next: UploadedImage[]) => {
      setImages(next);
      onImagesChange?.(next);
    },
    [onImagesChange]
  );

  // 处理文件选择
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        // 客户端校验
        if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
          setError(`不支持的格式: ${file.name}`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          setError(`文件过大: ${file.name} (${formatSize(file.size)})`);
          continue;
        }
        if (images.length >= maxImages) {
          setError(`最多上传 ${maxImages} 张图片`);
          break;
        }

        // 立即预览
        const preview = URL.createObjectURL(file);

        // 上传到服务器
        setUploading(preview);
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("colonyId", colonyId);

          const res = await fetch("/api/upload-image", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "上传失败");
          }

          const result = await res.json();
          notifyChange([
            ...images,
            {
              url: result.url,
              path: result.path,
              preview,
              fileName: file.name,
            },
          ]);
        } catch (err) {
          // 上传失败，移除临时预览
          URL.revokeObjectURL(preview);
          setError(err instanceof Error ? err.message : "上传失败");
        } finally {
          setUploading(null);
        }
      }
    },
    [images, colonyId, maxImages, notifyChange]
  );

  // 删除图片
  const handleRemove = useCallback(
    async (idx: number) => {
      const img = images[idx];
      if (!img) return;

      // 已上传的文件需要从 Storage 删除
      if (img.path) {
        try {
          await fetch("/api/delete-image", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: img.path }),
          });
        } catch {
          // 删除失败不影响前端移除
        }
      }

      URL.revokeObjectURL(img.preview);
      const next = images.filter((_, i) => i !== idx);
      notifyChange(next);
    },
    [images, notifyChange]
  );

  // 拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  return (
    <div className="relative group">
      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-3 group-focus-within:text-primary transition-colors">
        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 group-focus-within:bg-primary" />
        观测影像 / Observation Images
      </label>

      {/* 拖拽上传区域 */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer
          ${images.length >= maxImages
            ? "border-white/5 bg-black/10 opacity-50 cursor-not-allowed"
            : "border-white/20 bg-black/20 hover:border-primary/40 hover:bg-primary/5"
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
          disabled={images.length >= maxImages}
        />

        <div className="flex flex-col items-center justify-center py-8 px-4">
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
              <p className="text-sm text-foreground/70">正在上传...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                <Upload className="w-5 h-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-foreground/70 font-medium">
                点击或拖拽上传观测影像
              </p>
              <p className="text-[10px] text-muted-foreground/40 mt-1.5 tracking-wider uppercase">
                JPG / PNG / WEBP &middot; 单张 &le;{MAX_FILE_SIZE / 1024 / 1024}MB &middot; 最多 {maxImages} 张
              </p>
            </>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
          <p className="text-xs text-destructive">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-destructive/50 hover:text-destructive text-xs"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 预览网格 */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
          {images.map((img, idx) => (
            <div
              key={img.preview}
              className="relative aspect-square rounded-xl overflow-hidden bg-black/30 border border-white/5 group/item"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.preview}
                alt={img.fileName}
                className="w-full h-full object-cover"
              />

              {/* 上传中遮罩 */}
              {uploading === img.preview && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}

              {/* 删除按钮 */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(idx);
                }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover/item:opacity-100 hover:bg-destructive/80 transition-all"
              >
                <X className="w-3 h-3 text-white" />
              </button>

              {/* 文件大小标签 */}
              <span className="absolute bottom-1 left-1 text-[9px] font-mono bg-black/60 text-white/70 px-1 rounded">
                {idx + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 隐藏字段：将已上传的图片信息传递给 Server Action */}
      {images.map((img) => (
        <input
          key={img.path || img.preview}
          type="hidden"
          name="logImages"
          value={JSON.stringify({ url: img.url, path: img.path })}
        />
      ))}
    </div>
  );
}
