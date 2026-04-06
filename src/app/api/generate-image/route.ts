import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-api";
import { db } from "@/lib/db";
import {
  generateAntImage,
  generateImageFromPrompt,
  type AntPromptOptions,
  type ImageGenOptions,
} from "@/lib/image-gen";

/**
 * POST /api/generate-image
 *
 * 支持两种模式：
 * 1. 蚁种插图模式（传入 species 信息，自动构建专业 prompt）
 * 2. 自定义 Prompt 模式（直接传入 prompt 文本）
 *
 * 两种模式都会将生成的图片记录写入 generated_images 表
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "请先登录。" }, { status: 401 });
    }

    const body = await request.json();
    const mode = body.mode || "custom"; // "ant" | "custom"

    if (mode === "ant") {
      // ---- 蚁种插图模式 ----
      const antOpts: AntPromptOptions = {
        nameCn: body.nameCn,
        nameLat: body.nameLat,
        view: body.view || "dorsal",
        style: body.style || "scientific",
        caste: body.caste || "worker",
      };

      const genOpts: ImageGenOptions = {
        aspectRatio: body.aspectRatio || "1:1",
        n: body.n || 1,
        seed: body.seed,
      };

      // 校验必填字段
      if (!antOpts.nameCn || !antOpts.nameLat) {
        return NextResponse.json(
          { error: "蚁种模式需要提供 nameCn 和 nameLat。" },
          { status: 400 }
        );
      }

      // 查询 species_id
      const { data: species, error: speciesErr } = await db
        .from("species")
        .select("id")
        .ilike("name_lat", antOpts.nameLat)
        .limit(1)
        .single();

      if (speciesErr || !species) {
        return NextResponse.json(
          { error: `未找到物种 "${antOpts.nameLat}" 的记录。` },
          { status: 404 }
        );
      }

      const result = await generateAntImage(
        { ...antOpts, speciesId: species.id as number },
        { ...genOpts, createdBy: user.id }
      );
      return NextResponse.json(result);
    }

    // ---- 自定义 Prompt 模式 ----
    const { prompt, speciesId, ...genOpts } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "请提供 prompt 内容。" },
        { status: 400 }
      );
    }

    const result = await generateImageFromPrompt(prompt, {
      ...genOpts,
      speciesId: speciesId || undefined,
      createdBy: user.id,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[generate-image] Error:", error);
    const message =
      error instanceof Error ? error.message : "图片生成失败，请稍后重试。";

    // 超时特殊处理
    if (message.includes("timeout") || message.includes("aborted")) {
      return NextResponse.json(
        { error: "图片生成超时，请稍后重试（生成通常需要 10-30 秒）。" },
        { status: 504 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
