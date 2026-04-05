import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const GBIF_BASE = "https://api.gbif.org/v1/occurrence/search";

/**
 * 从 GBIF API 获取指定物种的标本图片
 * 优先使用顶层 media 字段（简洁结构），回退到 extensions Multimedia
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
    let imageUrl = null;
    let creator = null;
    let license = null;

    // 优先使用顶层 media 字段（GBIF 简化格式）
    if (Array.isArray(occ.media) && occ.media.length > 0) {
      const m = occ.media[0];
      imageUrl = m.references || m.identifier;
      creator = m.creator;
      license = m.license;
    }
    // 回退到 extensions Multimedia（Darwin Core 格式）
    if (!imageUrl) {
      const extMedia =
        occ.extensions?.["http://rs.gbif.org/terms/1.0/Multimedia"];
      if (extMedia && Array.isArray(extMedia) && extMedia.length > 0) {
        const img = extMedia[0];
        imageUrl = img["http://purl.org/dc/terms/identifier"];
        creator =
          img["http://purl.org/dc/terms/creator"] || occ.recordedBy || null;
        license = img["http://purl.org/dc/terms/license"] || null;
      }
    }

    if (!imageUrl) continue;

    images.push({
      species_id: null,
      url: imageUrl,
      thumbnail_url: null,
      view_type: "dorsal",
      is_primary: false,
      source: "gbif",
      source_id: String(occ.key),
      photographer: creator,
      license: license,
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

      // 先删除该物种旧图片，再插入新数据（保证幂等）
      await supabase
        .from("specimen_images")
        .delete()
        .eq("species_id", sp.id);

      const { error: insertErr } = await supabase
        .from("specimen_images")
        .insert(images);

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
