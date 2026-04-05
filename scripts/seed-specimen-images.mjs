import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const GBIF_BASE = "https://api.gbif.org/v1/occurrence/search";

/**
 * 将 GBIF 返回的图片 URL 转换为可直链访问的格式
 * 主要处理 iNaturalist 照片页链接 → S3 直链
 */
function normalizeImageUrl(url) {
  if (!url) return null;

  // iNaturalist: www.inaturalist.org/photos/{id} → S3 open-data 直链
  const inatMatch = url.match(/inaturalist\.org\/photos\/(\d+)/);
  if (inatMatch) {
    const photoId = inatMatch[1];
    return `https://inaturalist-open-data.s3.amazonaws.com/photos/${photoId}/medium.jpg`;
  }

  // 其他域名原样返回（后续由验证步骤过滤）
  return url;
}

/**
 * 验证图片 URL 是否可访问（HEAD 请求，5 秒超时）
 */
async function validateImageUrl(url, timeoutMs = 5000) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * 从 GBIF API 获取指定物种的标本图片
 */
async function fetchGbifImages(scientificName, limit = 20) {
  const url = `${GBIF_BASE}?scientificName=${encodeURIComponent(scientificName)}&mediaType=StillImage&limit=${limit}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GBIF API error ${res.status}: ${scientificName}`);
  }

  const json = await res.json();
  const results = json.results || [];

  const images = [];
  const seenUrls = new Set(); // 去重

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

    // URL 标准化
    imageUrl = normalizeImageUrl(imageUrl);
    if (!imageUrl) continue;

    // 去重
    if (seenUrls.has(imageUrl)) continue;
    seenUrls.add(imageUrl);

    images.push({
      species_id: null,
      url: imageUrl,
      thumbnail_url: null, // 由验证后生成
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

  // 获取所有启用的物种
  const { data: species, error: spErr } = await supabase
    .from("species")
    .select("id, name_lat")
    .eq("status", 1)
    .order("sort_order", { ascending: true });

  if (spErr) throw spErr;
  console.log(`Found ${species.length} species to process.`);

  let totalFetched = 0;   // 从 GBIF 获取的总数
  let totalValidated = 0; // 验证通过的总数
  let totalInserted = 0;  // 实际插入的总数
  let skippedNoImages = 0;
  let errors = 0;

  for (const sp of species) {
    console.log(`Processing: ${sp.name_lat} (id=${sp.id})`);

    try {
      const rawImages = await fetchGbifImages(sp.name_lat, 20);

      if (rawImages.length === 0) {
        skippedNoImages++;
        console.log(`  -> No images found, skipping.`);
        await new Promise((r) => setTimeout(r, 100));
        continue;
      }

      totalFetched += rawImages.length;
      console.log(`  -> Fetched ${rawImages.length} candidates.`);

      // 验证每个 URL 是否可访问
      const validImages = [];
      for (const img of rawImages) {
        const ok = await validateImageUrl(img.url);
        if (ok) {
          validImages.push(img);
          totalValidated++;
        }
      }

      if (validImages.length === 0) {
        console.log(`  -> All URLs invalid, skipping.`);
        errors++;
        continue;
      }

      console.log(
        `  -> Validated ${validImages.length}/${rawImages.length} URLs OK.`
      );

      // 截取最多 15 张
      const toInsert = validImages.slice(0, 15);

      // 第一张标记为主图
      if (toInsert.length > 0) {
        toInsert[0].is_primary = true;
      }

      // 填充 species_id + 生成缩略图 URL
      for (const img of toInsert) {
        img.species_id = sp.id;
        // 缩略图：iNaturalist S3 用 small 尺寸，其他用原图
        if (img.url.includes("inaturalist-open-data.s3")) {
          img.thumbnail_url = img.url.replace("/medium.jpg", "/small.jpg");
        }
      }

      // 先删后插（幂等）
      await supabase.from("specimen_images").delete().eq("species_id", sp.id);

      const { error: insertErr } = await supabase
        .from("specimen_images")
        .insert(toInsert);

      if (insertErr) {
        console.error(`  -> Insert error:`, insertErr.message);
        errors++;
        continue;
      }

      totalInserted += toInsert.length;
      console.log(`  -> Inserted ${toInsert.length} images.`);

      // 限速
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error(`  -> Error:`, err.message);
      errors++;
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Species processed:     ${species.length}`);
  console.log(`Candidates fetched:   ${totalFetched}`);
  console.log(`URLs validated OK:    ${totalValidated}`);
  console.log(`Images inserted:      ${totalInserted}`);
  console.log(`Skipped (no data):    ${skippedNoImages}`);
  console.log(`Errors:               ${errors}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
