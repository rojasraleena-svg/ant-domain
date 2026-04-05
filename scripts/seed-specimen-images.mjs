import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const GBIF_BASE = "https://api.gbif.org/v1/occurrence/search";

/**
 * 从 GBIF API 获取指定物种的标本图片
 * @param {string} scientificName - 物种学名
 * @param {number} limit - 每个物种最大获取图片数
 * @returns {Promise<Array>} 解析后的图片记录数组
 */
async function fetchGbifImages(scientificName, limit = 15) {
  const url = `${GBIF_BASE}?scientificName=${encodeURIComponent(scientificName)}&mediaType=StillImage&limit=${limit}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GBIF API error ${res.status}: ${scientificName}`);
  }

  const json = await res.json();
  const results = json.results || [];

  const images = [];

  for (const occ of results) {
    const media =
      occ.extensions?.["http://rs.tdwg.org/dwc/terms/Multimedia"];
    if (!media || !Array.isArray(media) || media.length === 0) continue;

    // 取每个 occurrence 的第一张图
    const img = media[0];
    const imageUrl = img["http://purl.org/dc/terms/identifier"];
    if (!imageUrl) continue;

    // 根据标题/描述推断视角类型（启发式）
    const title = (img["http://purl.org/dc/terms/title"] || "").toLowerCase();
    let viewType = "dorsal";
    if (
      title.includes("lateral") ||
      title.includes("side") ||
      title.includes("profile")
    ) {
      viewType = "lateral";
    } else if (
      title.includes("front") ||
      title.includes("face") ||
      title.includes("head")
    ) {
      viewType = "frontal";
    } else if (
      title.includes("nest") ||
      title.includes("habitat") ||
      title.includes("colony")
    ) {
      viewType = "habitat";
    }

    images.push({
      species_id: null, // 由调用方填充
      url: imageUrl,
      thumbnail_url: null,
      view_type: viewType,
      is_primary: false, // 调用方将第一张设为主图
      source: "gbif",
      source_id: String(occ.key),
      photographer:
        img["http://purl.org/dc/terms/creator"] || occ.recordedBy || null,
      license: img["http://purl.org/dc/terms/license"] || null,
      dataset_name: occ.datasetName || null,
      country: occ.country || null,
      sort_order: 0,
      status: 1,
    });
  }

  return images;
}

async function main() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error("Missing Supabase environment variables.");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1. 获取所有启用的物种
  const { data: species, error: spErr } = await supabase
    .from("species")
    .select("id, name_lat")
    .eq("status", 1)
    .order("sort_order", { ascending: true });

  if (spErr) throw spErr;
  console.log(`Found ${species.length} species to process.`);

  let totalInserted = 0;
  let skippedNoImages = 0;
  let errors = 0;

  for (const sp of species) {
    console.log(`Processing: ${sp.name_lat} (id=${sp.id})`);

    try {
      const images = await fetchGbifImages(sp.name_lat, 15);

      if (images.length === 0) {
        skippedNoImages++;
        console.log(`  -> No images found, skipping.`);
        // 短暂延迟避免请求过快
        await new Promise((r) => setTimeout(r, 100));
        continue;
      }

      // 第一张图标记为主图
      if (images.length > 0) {
        images[0].is_primary = true;
      }

      // 填充 species_id
      for (const img of images) {
        img.species_id = sp.id;
      }

      // Upsert by source_id 避免重复
      const { error: insertErr } = await supabase
        .from("specimen_images")
        .upsert(images, {
          onConflict: "source_id",
          ignoreDuplicates: true,
          defaultToNull: false,
        });

      if (insertErr) {
        console.error(
          `  -> Insert error for ${sp.name_lat}:`,
          insertErr.message
        );
        errors++;
        continue;
      }

      totalInserted += images.length;
      console.log(`  -> Inserted ${images.length} images.`);

      // GBIF 限速：每个物种请求间隔 200ms
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      console.error(`  -> Error processing ${sp.name_lat}:`, err.message);
      errors++;
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Total species processed: ${species.length}`);
  console.log(`Total images inserted: ${totalInserted}`);
  console.log(`Skipped (no images): ${skippedNoImages}`);
  console.log(`Errors: ${errors}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
