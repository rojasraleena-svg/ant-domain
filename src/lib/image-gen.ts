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
  /** 永久图片 URL 列表（已存入 Supabase） */
  imageUrls: string[];
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failedCount: number;
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
  dorsal: "背视图 (dorsal view)",
  lateral: "侧视图 (lateral view)",
  frontal: "头面部视图 (frontal view)",
  habitat: "生态环境视角 (in natural habitat)",
};

const STYLE_TEMPLATES: Record<string, string> = {
  scientific:
    "scientific illustration style, clean white background, labeled anatomical features, textbook quality, ultra-detailed line art with subtle color",
  macro_photo:
    "extreme macro photography, shallow depth of field, studio lighting, photorealistic, showing fine texture of exoskeleton and setae (hairs), National Geographic quality",
  watercolor:
    "delicate watercolor painting, natural history illustration style, soft colors, artistic but scientifically accurate, vintage field guide aesthetic",
  realistic:
    "photorealistic digital art, highly detailed, natural lighting, lifelike appearance, 8K resolution quality",
};

const CASTE_LABELS: Record<string, string> = {
  worker: "worker ant (工蚁)",
  queen: "queen ant (蚁后)",
  male: "male ant (雄蚁)",
  soldier: "soldier ant (兵蚁)",
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

// ---- Prompt 构建：蚂蚁专用模板 ----

/**
 * 构建蚂蚁物种的专业文生图 Prompt
 */
export function buildAntPrompt(opts: AntPromptOptions): string {
  const casteText = opts.caste ? CASTE_LABELS[opts.caste] || opts.caste : "worker ant (工蚁)";
  const viewText = opts.view ? VIEW_LABELS[opts.view] || opts.view : "dorsal view (背视图)";
  const styleText = opts.style ? STYLE_TEMPLATES[opts.style] || STYLE_TEMPLATES.scientific : STYLE_TEMPLATES.scientific;

  return [
    `A detailed ${casteText} of the ant species ${opts.nameLat} (${opts.nameCn}),`,
    `${viewText},`,
    styleText + ",",
    "ultra-high detail, professional entomological reference image.",
  ].join(" ");
}

// ---- 对外接口：完整生成流程 ----

/**
 * 生成蚂蚁插图 — 完整流程
 * 1. 构建专业 Prompt
 * 2. 调用 MiniMax API 生成图片
 * 3. 下载并持久化到 Supabase Storage
 *
 * @returns 包含永久 URL 的结果
 */
export async function generateAntImage(
  promptOpts: AntPromptOptions,
  genOptions: ImageGenOptions = {}
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

  return {
    taskId: apiResult.id,
    imageUrls: permanentUrls,
    successCount: permanentUrls.length,
    failedCount: apiResult.imageUrls.length - permanentUrls.length,
  };
}

/**
 * 使用自定义 Prompt 生成图片（不经过蚂蚁模板）
 */
export async function generateImageFromPrompt(
  prompt: string,
  options: ImageGenOptions = {}
): Promise<ImageGenResult> {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error("Prompt 不能为空");
  }
  if (prompt.length > 1500) {
    throw new Error("Prompt 不能超过 1500 字符");
  }

  const apiResult = await callMiniMaxAPI(prompt.trim(), options);

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

  return {
    taskId: apiResult.id,
    imageUrls: permanentUrls,
    successCount: permanentUrls.length,
    failedCount: apiResult.imageUrls.length - permanentUrls.length,
  };
}
