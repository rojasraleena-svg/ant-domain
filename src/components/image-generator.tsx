"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Wand2, Loader2, CheckCircle2, AlertCircle, RotateCcw, Pencil, Eye, Star, Trash2, ImagePlus, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ---- 类型 ----

interface ImageGeneratorProps {
  /** 物种中文名 */
  nameCn: string;
  /** 物种拉丁名 */
  nameLat: string;
  /** 物种 ID（用于关联数据库记录） */
  speciesId: number;
}

interface GeneratedImage {
  url: string;
  prompt: string;
}

interface HistoryImage {
  id: number;
  url: string;
  prompt: string;
  model: string;
  view_type: string | null;
  style: string | null;
  caste: string | null;
  is_featured: boolean;
  created_at: string;
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

const STYLE_LABEL_MAP: Record<string, string> = {
  scientific: "科学插图",
  macro_photo: "微距摄影",
  watercolor: "手绘水彩",
  realistic: "写实数字画",
};

const VIEW_LABEL_MAP: Record<string, string> = {
  dorsal: "背视图",
  lateral: "侧视图",
  frontal: "头面部",
  habitat: "生态环境",
};

const CASTE_LABEL_MAP: Record<string, string> = {
  worker: "工蚁",
  queen: "蚁后",
  soldier: "兵蚁",
  male: "雄蚁",
};

// ---- Prompt 模板（与 image-gen.ts 保持同步）----

const VIEW_LABELS: Record<string, string> = {
  dorsal: "shown from above, full dorsal view",
  lateral: "side profile view, lateral perspective",
  frontal: "close-up front view showing head and antennae",
  habitat: "in its natural habitat environment",
};

const STYLE_TEMPLATES: Record<string, string> = {
  scientific:
    "clean scientific illustration on pure white background, precise linework with subtle color shading, encyclopedia plate style",
  macro_photo:
    "stunning close-up macro photography, sharp focus, soft studio lighting, incredible detail of body texture, professional nature photography",
  watercolor:
    "gentle hand-painted watercolor illustration, soft natural tones, vintage naturalist field journal aesthetic",
  realistic:
    "beautifully rendered digital artwork, photorealistic quality, warm natural lighting, gallery-worthy detail",
};

const CASTE_LABELS: Record<string, string> = {
  worker: "sterile female caste, typical size",
  queen: "reproductive female, larger body with wings scars visible",
  male: "alate male with wings",
  soldier: "major caste with enlarged head and mandibles",
};

/** 根据选项构建 prompt（客户端版本） */
function buildPrompt(nameLat: string, view: string, style: string, caste: string): string {
  const casteText = caste ? CASTE_LABELS[caste] || "" : "";
  const viewText = view ? VIEW_LABELS[view] || "" : "shown from above";
  const styleText = style ? STYLE_TEMPLATES[style] || STYLE_TEMPLATES.scientific : STYLE_TEMPLATES.scientific;

  const parts = [
    `A beautiful ${nameLat} ant,`,
    casteText,
    `${viewText}.`,
    styleText,
  ];

  return parts.filter(Boolean).join(" ");
}

// ---- 组件 ----

export function ImageGenerator({ nameCn, nameLat, speciesId }: ImageGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<string>("dorsal");
  const [style, setStyle] = useState<string>("scientific");
  const [caste, setCaste] = useState<string>("worker");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [promptText, setPromptText] = useState<string>("");
  const [editingPrompt, setEditingPrompt] = useState<boolean>(false);

  // 历史图片
  const [historyImages, setHistoryImages] = useState<HistoryImage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  const initializedRef = useRef(false);

  // 根据当前选项自动构建 prompt
  const autoPrompt = useMemo(
    () => buildPrompt(nameLat, view, style, caste),
    [nameLat, view, style, caste]
  );

  // 初始化或选项变更时同步 prompt（仅在未手动编辑时）
  useMemo(() => {
    if (!editingPrompt) {
      setPromptText(autoPrompt);
    }
  }, [autoPrompt, editingPrompt]);

  // 加载历史生成记录
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from("generated_images")
        .select("*")
        .eq("species_id", speciesId)
        .eq("status", 1)
        .order("created_at", { ascending: false })
        .limit(20);

      if (err) throw err;
      setHistoryImages((data || []) as HistoryImage[]);
    } catch {
      // 静默失败，历史记录非核心功能
    } finally {
      setHistoryLoading(false);
    }
  }, [speciesId]);

  // 展开时加载历史
  useEffect(() => {
    if (open && !initializedRef.current) {
      initializedRef.current = true;
      loadHistory();
    }
  }, [open, loadHistory]);

  // 设为封面 / 取消封面
  const handleToggleFeatured = async (id: number, currentFeatured: boolean) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("generated_images")
        .update({ is_featured: !currentFeatured })
        .eq("id", id);

      if (error) throw error;

      setHistoryImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, is_featured: !currentFeatured } : img
        )
      );
    } catch {
      // 静默失败
    }
  };

  // 删除图片
  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这张图片吗？")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("generated_images")
        .update({ status: 0 })
        .eq("id", id);

      if (error) throw error;

      setHistoryImages((prev) => prev.filter((img) => img.id !== id));
    } catch {
      // 静默失败
    }
  };

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const finalPrompt = promptText;
      const isCustom = finalPrompt !== autoPrompt;

      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isCustom
            ? { mode: "custom", prompt: finalPrompt, n: 1, speciesId }
            : { mode: "ant", nameCn, nameLat, view, style, caste, n: 1 }
        ),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "生成失败");
      }

      if (data.imageUrls && data.imageUrls.length > 0) {
        setResult({ url: data.imageUrls[0], prompt: finalPrompt });
        // 刷新历史列表
        loadHistory();
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
  }, [nameCn, nameLat, view, style, caste, promptText, autoPrompt, speciesId, loadHistory]);

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
            setEditingPrompt(false);
            initializedRef.current = false;
          }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          收起
        </button>
      </div>

      {/* 历史生成记录 */}
      {historyImages.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            历史生成 ({historyImages.length})
          </button>
          {showHistory && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {historyImages.map((img) => (
                <div
                  key={img.id}
                  className={`group relative rounded-lg overflow-hidden border bg-background/40 ${
                    img.is_featured ? "border-yellow-500/40 ring-1 ring-yellow-500/20" : "border-white/10"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={`${nameCn} AI 插图`}
                    className="w-full aspect-square object-cover"
                  />
                  {/* 封面标记 */}
                  {img.is_featured && (
                    <div className="absolute top-1 left-1 flex items-center gap-0.5 rounded-full bg-yellow-500/90 px-1.5 py-0.5 text-[9px] text-yellow-900 font-medium">
                      <Star className="w-2.5 h-2.5" />
                      封面
                    </div>
                  )}
                  {/* 悬停操作 */}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between items-center p-1.5 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleToggleFeatured(img.id, img.is_featured)}
                      className="p-1 rounded hover:bg-white/20 transition-colors"
                      title={img.is_featured ? "取消封面" : "设为封面"}
                    >
                      <Star className={`w-3.5 h-3.5 ${img.is_featured ? "fill-yellow-400 text-yellow-400" : "text-white"}`} />
                    </button>
                    <button
                      onClick={() => handleDelete(img.id)}
                      className="p-1 rounded hover:bg-red-500/30 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                  {/* 参数标签 */}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {img.style && (
                      <span className="rounded bg-black/60 px-1 py-0.5 text-[8px] text-white">
                        {STYLE_LABEL_MAP[img.style] || img.style}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

      {/* Prompt 预览 / 编辑区域 */}
      {!result && !loading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              {editingPrompt ? (
                <Pencil className="w-3 h-3 text-primary" />
              ) : (
                <Eye className="w-3 h-3 text-muted-foreground" />
              )}
              生成提示词
              {!editingPrompt && promptText === autoPrompt && (
                <span className="text-[10px] normal-case tracking-normal text-muted-foreground/60 font-normal">
                  （自动生成）
                </span>
              )}
              {editingPrompt && promptText !== autoPrompt && (
                <span className="text-[10px] normal-case tracking-normal text-primary/70 font-normal">
                  （已编辑）
                </span>
              )}
            </label>
            {!editingPrompt ? (
              <button
                onClick={() => setEditingPrompt(true)}
                className="text-[11px] text-primary/70 hover:text-primary transition-colors flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" />
                编辑
              </button>
            ) : (
              <button
                onClick={() => {
                  setPromptText(autoPrompt);
                  setEditingPrompt(false);
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                还原默认
              </button>
            )}
          </div>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            readOnly={!editingPrompt}
            rows={3}
            className={`w-full rounded-md border px-3 py-2 text-xs leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 ${
              editingPrompt
                ? "border-primary/40 bg-background text-foreground"
                : "border-white/10 bg-muted/30 text-muted-foreground cursor-default"
            }`}
            placeholder="选择上方参数后自动生成提示词..."
          />
        </div>
      )}

      {/* 操作按钮 / 状态显示 */}
      {!result && !loading && !error && (
        <button
          onClick={() => handleGenerate()}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <ImagePlus className="w-4 h-4" />
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
          {result.prompt && (
            <details className="group">
              <summary className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none flex items-center gap-1">
                <Eye className="w-3 h-3" />
                查看使用的提示词
              </summary>
              <p className="mt-1.5 text-[11px] text-muted-foreground/70 leading-relaxed bg-muted/30 rounded-md px-3 py-2 font-mono break-all">
                {result.prompt}
              </p>
            </details>
          )}
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
              onClick={() => handleGenerate()}
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
