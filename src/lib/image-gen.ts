// ============================================
// MiniMax 文生图服务 — 蚁域 AI 插图生成
// Pipeline: Claude 优化 Prompt → MiniMax 出图 → Supabase 持久化
// ============================================

import { db } from "./db";

// ---- 类型定义 ----

export interface ImageGenOptions {
  /** 图片宽高比 */
  aspectRatio?: "1:1" | "16:9" | "4:3" | "3:2" | "2:3" | "3:4" | "9:16" | "21:9";
  /** 生成数量 1-9 */
  n?: number;
  /** 是否开启 prompt 自动优化 */
  promptOptimizer?: boolean;
  /** 随机种子（可复现结果） */
  seed?: number;
}

export interface ImageGenResult {
  /** 任务 ID */
  taskId: string;
  /** 永久图片 URL 列表（已存入 Supabase Storage） */
  imageUrls: string[];
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failedCount: number;
  /** 数据库记录 ID 列表 */
  recordIds?: number[];
}

export interface AntPromptOptions {
  /** 物种中文名 */
  nameCn: string;
  /** 物种拉丁名 */
  nameLat: string;
  /** 视角类型 */
  view?: "dorsal" | "lateral" | "frontal" | "habitat";
  /** 风格 */
  style?: "scientific" | "macro_photo" | "watercolor" | "realistic";
  /** 角色 caste */
  caste?: "worker" | "queen" | "male" | "soldier";
}

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

// ---- 核心：调用 MiniMax T2I API ----

/**
 * 调用 MiniMax 文生图 API
 * 返回临时 URL（24h 有效），调用方需自行持久化
 */
async function callMiniMaxAPI(
  prompt: string,
  options: ImageGenOptions = {}
): Promise<{
  id: string;
  imageUrls: string[];
  successCount: number;
  failedCount: number;
}> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    throw new Error("MINIMAX_API_KEY 未配置");
  }

  const body = {
    model: "image-01",
    prompt,
    aspect_ratio: options.aspectRatio || "1:1",
    response_format: "url" as const,
    n: Math.min(options.n || 1, 9),
    prompt_optimizer: options.promptOptimizer ?? true,
    ...(options.seed !== undefined && { seed: options.seed }),
  };

  const res = await fetch("https://api.minimaxi.com/v1/image_generation", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    // 图片生成可能较慢，设置 60s 超时
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "未知错误");
    throw new Error(`MiniMax API 错误 (${res.status}): ${errText}`);
  }

  const json = await res.json();

  if (json.base_resp?.status_code !== 0) {
    throw new Error(
      `MiniMax API 业务错误: ${json.base_resp?.status_msg || "未知"}`
    );
  }

  return {
    id: json.id,
    imageUrls: json.data?.image_urls || [],
    successCount: parseInt(json.metadata?.success_count || "0", 10),
    failedCount: parseInt(json.metadata?.failed_count || "0", 10),
  };
}

// ---- 存储：下载 + 上传 Supabase Storage ----

/**
 * 从临时 URL 下载图片并上传到 Supabase Storage，返回永久 URL
 */
async function persistImagesToStorage(
  tempUrls: string[],
  prefix: string = "ai-generated"
): Promise<string[]> {
  const permanentUrls: string[] = [];

  for (let i = 0; i < tempUrls.length; i++) {
    try {
      // 下载图片
      const imgRes = await fetch(tempUrls[i], { signal: AbortSignal.timeout(30_000) });
      if (!imgRes.ok) continue;

      const contentType =
        imgRes.headers.get("content-type") || "image/png";
      const ext = contentType.includes("jpeg") || contentType.includes("jpg")
        ? "jpg"
        : contentType.includes("webp")
          ? "webp"
          : "png";

      const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

      // 上传到 species-images bucket
      const fileName = `${prefix}/${Date.now()}-${i + 1}.${ext}`;
      const { error: uploadError } = await db.storage
        .from("species-images")
        .upload(fileName, imgBuffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        console.error(`上传图片失败 [${i}]:`, uploadError.message);
        continue;
      }

      // 获取公开 URL
      const {
        data: { publicUrl },
      } = db.storage.from("species-images").getPublicUrl(fileName);
      permanentUrls.push(publicUrl);
    } catch (err) {
      console.error(`处理图片失败 [${i}]:`, err);
    }
  }

  return permanentUrls;
}

// ---- 数据库：写入 generated_images 记录 ----

interface SaveRecordOptions {
  speciesId: number;
  urls: string[];
  prompt: string;
  model?: string;
  viewType?: string;
  style?: string;
  caste?: string;
  aspectRatio?: string;
  taskId?: string;
  createdBy?: string; // UUID
}

/**
 * 将生成的图片记录写入 generated_images 表
 */
async function saveImageRecords(opts: SaveRecordOptions): Promise<number[]> {
  if (opts.urls.length === 0) return [];

  const records = opts.urls.map((url) => ({
    species_id: opts.speciesId,
    url,
    prompt: opts.prompt,
    model: opts.model || "image-01",
    view_type: opts.viewType || null,
    style: opts.style || null,
    caste: opts.caste || null,
    aspect_ratio: opts.aspectRatio || "1:1",
    task_id: opts.taskId || null,
    created_by: opts.createdBy || null,
  }));

  const { data, error } = await db
    .from("generated_images")
    .insert(records)
    .select("id");

  if (error) {
    console.error("[image-gen] 写入图片记录失败:", error.message);
    return [];
  }

  return (data || []).map((r) => r.id as number);
}

/**
 * 构建蚂蚁物种的专业文生图 Prompt
 */
export function buildAntPrompt(opts: AntPromptOptions): string {
  const casteText = opts.caste ? CASTE_LABELS[opts.caste] || "" : "";
  const viewText = opts.view ? VIEW_LABELS[opts.view] || "" : "shown from above";
  const styleText = opts.style ? STYLE_TEMPLATES[opts.style] || STYLE_TEMPLATES.scientific : STYLE_TEMPLATES.scientific;

  // 构建自然语言描述，避免混入中文和敏感词汇
  const parts = [
    `A beautiful ${opts.nameLat} ant,`,
    casteText,
    `${viewText}.`,
    styleText,
  ];

  return parts.filter(Boolean).join(" ");
}

// ---- 对外接口：完整生成流程 ----

/**
 * 生成蚂蚁插图 — 完整流程
 * 1. 构建专业 Prompt
 * 2. 调用 MiniMax API 生成图片
 * 3. 下载并持久化到 Supabase Storage
 * 4. 写入 generated_images 数据库记录
 *
 * @returns 包含永久 URL 和记录 ID 的结果
 */
export async function generateAntImage(
  promptOpts: AntPromptOptions & { speciesId: number },
  genOptions: ImageGenOptions & { createdBy?: string } = {}
): Promise<ImageGenResult> {
  // Step 1: 构建 Prompt
  const prompt = buildAntPrompt(promptOpts);

  // Step 2: 调用 MiniMax API
  const apiResult = await callMiniMaxAPI(prompt, genOptions);

  if (apiResult.imageUrls.length === 0) {
    return {
      taskId: apiResult.id,
      imageUrls: [],
      successCount: 0,
      failedCount: apiResult.failedCount,
    };
  }

  // Step 3: 持久化存储
  const storagePrefix = `ant-${promptOpts.nameLat.toLowerCase().replace(/\s+/g, "-")}`;
  const permanentUrls = await persistImagesToStorage(apiResult.imageUrls, storagePrefix);

  // Step 4: 写入数据库记录
  const recordIds = await saveImageRecords({
    speciesId: promptOpts.speciesId,
    urls: permanentUrls,
    prompt,
    model: "image-01",
    viewType: promptOpts.view,
    style: promptOpts.style,
    caste: promptOpts.caste,
    aspectRatio: genOptions.aspectRatio || "1:1",
    taskId: apiResult.id,
    createdBy: genOptions.createdBy,
  });

  return {
    taskId: apiResult.id,
    imageUrls: permanentUrls,
    successCount: permanentUrls.length,
    failedCount: apiResult.imageUrls.length - permanentUrls.length,
    recordIds,
  };
}

/**
 * 使用自定义 Prompt 生成图片（不经过蚂蚁模板）
 */
export async function generateImageFromPrompt(
  prompt: string,
  options: ImageGenOptions & { speciesId?: number; createdBy?: string } = {}
): Promise<ImageGenResult> {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error("Prompt 不能为空");
  }
  if (prompt.length > 1500) {
    throw new Error("Prompt 不能超过 1500 字符");
  }

  const trimmedPrompt = prompt.trim();
  const apiResult = await callMiniMaxAPI(trimmedPrompt, options);

  if (apiResult.imageUrls.length === 0) {
    return {
      taskId: apiResult.id,
      imageUrls: [],
      successCount: 0,
      failedCount: apiResult.failedCount,
    };
  }

  const permanentUrls = await persistImagesToStorage(
    apiResult.imageUrls,
    "custom"
  );

  // 写入数据库记录（如果提供了 speciesId）
  let recordIds: number[] | undefined;
  if (options.speciesId) {
    recordIds = await saveImageRecords({
      speciesId: options.speciesId,
      urls: permanentUrls,
      prompt: trimmedPrompt,
      model: "image-01",
      aspectRatio: options.aspectRatio || "1:1",
      taskId: apiResult.id,
      createdBy: options.createdBy,
    });
  }

  return {
    taskId: apiResult.id,
    imageUrls: permanentUrls,
    successCount: permanentUrls.length,
    failedCount: apiResult.imageUrls.length - permanentUrls.length,
    recordIds,
  };
}
