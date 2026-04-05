"use client";

import { useState, useCallback } from "react";
import { Wand2, Loader2, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";

// ---- 类型 ----

interface ImageGeneratorProps {
  /** 物种中文名 */
  nameCn: string;
  /** 物种拉丁名 */
  nameLat: string;
}

interface GeneratedImage {
  url: string;
  prompt: string;
}

const VIEW_OPTIONS = [
  { value: "dorsal", label: "背视图" },
  { value: "lateral", label: "侧视图" },
  { value: "frontal", label: "头面部" },
  { value: "habitat", label: "生态环境" },
] as const;

const STYLE_OPTIONS = [
  { value: "scientific", label: "科学插图" },
  { value: "macro_photo", label: "微距摄影" },
  { value: "watercolor", label: "手绘水彩" },
  { value: "realistic", label: "写实数字画" },
] as const;

const CASTE_OPTIONS = [
  { value: "worker", label: "工蚁" },
  { value: "queen", label: "蚁后" },
  { value: "soldier", label: "兵蚁" },
] as const;

// ---- 组件 ----

export function ImageGenerator({ nameCn, nameLat }: ImageGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<string>("dorsal");
  const [style, setStyle] = useState<string>("scientific");
  const [caste, setCaste] = useState<string>("worker");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "ant",
          nameCn,
          nameLat,
          view,
          style,
          caste,
          n: 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "生成失败");
      }

      if (data.imageUrls && data.imageUrls.length > 0) {
        setResult({ url: data.imageUrls[0], prompt: "" });
      } else if (data.failedCount > 0) {
        throw new Error("图片被内容安全审核拦截，请尝试调整参数。");
      } else {
        throw new Error("未能生成图片，请稍后重试。");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  }, [nameCn, nameLat, view, style, caste]);

  // 折叠状态：只显示按钮
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary hover:border-primary/70 hover:bg-primary/10 transition-all duration-300"
      >
        <Wand2 className="w-4 h-4" />
        AI 生成插图
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-5 space-y-4">
      {/* 头部：标题 + 关闭 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-primary" />
          AI 插图生成 — {nameCn}
        </h3>
        <button
          onClick={() => {
            setOpen(false);
            setResult(null);
            setError(null);
          }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          收起
        </button>
      </div>

      {/* 参数选择 */}
      <div className="grid grid-cols-3 gap-3">
        {/* 视角 */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            视角
          </label>
          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            disabled={loading}
            className="w-full rounded-md border border-white/10 bg-background/60 px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
          >
            {VIEW_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* 风格 */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            风格
          </label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            disabled={loading}
            className="w-full rounded-md border border-white/10 bg-background/60 px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
          >
            {STYLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* 角色 */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            角色
          </label>
          <select
            value={caste}
            onChange={(e) => setCaste(e.target.value)}
            disabled={loading}
            className="w-full rounded-md border border-white/10 bg-background/60 px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
          >
            {CASTE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 操作按钮 / 状态显示 */}
      {!result && !loading && !error && (
        <button
          onClick={handleGenerate}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Wand2 className="w-4 h-4" />
          开始生成（约 10-30 秒）
        </button>
      )}

      {/* 加载中 */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-6 space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">AI 正在绘制中...</p>
          <p className="text-xs text-muted-foreground/50">
            首次生成可能需要较长时间，请耐心等待
          </p>
        </div>
      )}

      {/* 错误 */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-red-300">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs text-red-400 hover:text-red-300 underline underline-offset-2"
            >
              重试
            </button>
          </div>
        </div>
      )}

      {/* 结果预览 */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">生成成功</span>
          </div>
          <div className="rounded-lg overflow-hidden border border-white/10 bg-background/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.url}
              alt={`AI 生成的 ${nameCn} 插图`}
              className="w-full h-auto"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-white/10 px-3 py-2 text-xs font-medium text-foreground/80 hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              重新生成
            </button>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center rounded-md bg-primary/20 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/30 transition-colors text-center"
            >
              查看大图
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
