import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const GBIF_BASE = "https://api.gbif.org/v1/occurrence/search";

// ============================================
// 增量 + 并行 配置
// ============================================
const CONFIG = {
  MIN_IMAGES_TO_TRIGGER: 5,      // 少于此数量才触发
  MAX_IMAGES_PER_SPECIES: 15,    // 每种上限
  CANDIDATES_PER_REQUEST: 20,      // GBIF 每次请求数
  REQUEST_DELAY_MS: 0,             // 并行模式下不需要请求间延迟
  VALIDATE_TIMEOUT_MS: 5000,
  /** 并行度：同时处理多少个物种的 URL 验证（受内存/连接数限制） */
  PARALLEL_VALIDATE: 10,
};

// ============================================
// URL 工具函数
// ============================================
function normalizeImageUrl(url) {
  if (!url) return null;
  const m = url.match(/inaturalist\.org\/photos\/(\d+)/);
  if (m) return `https://inaturalist-open-data.s3.amazonaws.com/photos/${m[1]}/medium.jpg`;
  return url;
}

async function validateImageUrl(url, timeoutMs = CONFIG.VALIDATE_TIMEOUT_MS) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: ctrl.signal });
    clearTimeout(timer);
    return res.ok;
  } catch { return false; }
}

async function fetchGbifCandidates(scientificName) {
  const res = await fetch(`${GBIF_BASE}?scientificName=${encodeURIComponent(scientificName)}&mediaType=StillImage&limit=${CONFIG.CANDIDATES_PER_REQUEST}`);
  if (!res.ok) throw new Error(`GBIF API ${res.status}: ${scientificName}`);
  const json = await res.json();
  const results = json.results || [];
  const images = [], seen = new Set();
  for (const occ of results) {
    let url = null, creator = null, license = null;
    if (Array.isArray(occ.media) && occ.media.length > 0) {
      const m = occ.media[0]; url = m.references || m.identifier; creator = m.creator; license = m.license;
    } else {
      const ext = occ.extensions?.["http://rs.gbif.org/terms/1.0/Multimedia"];
      if (ext && Array.isArray(ext) && ext.length > 0) {
        const img = ext[0]; url = img["http://purl.org/dc/terms/identifier"];
        creator = img["http://purl.org/dc/terms/creator"] || occ.recordedBy || null; license = img["http://purl.org/dc/terms/license"] || null;
      }
    }
    url = normalizeImageUrl(url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    images.push({ species_id: null, url, thumbnail_url: null, view_type: "dorsal", is_primary: false, source: "gbif", source_id: String(occ.key), photographer: creator, license: license, dataset_name: occ.datasetName || null, country: occ.country || null, sort_order: 0, status: 1 });
  }
  return images;
}

// ============================================
// 并行主逻辑
// ============================================
async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing env vars.");
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // 1. 获取所有物种 + 已有图片数
  const { data: species } = await sb.from("species").select("id, name_lat, name_cn").eq("status", 1).order("sort_order", { ascending: true });
  if (!species?.length) throw new Error("No species found.");

  const existingCounts = new Map();
  for (const sp of species) {
    const { count } = await sb.from("specimen_images").select("*", { count: "exact", head: true }).eq("species_id", sp.id);
    existingCounts.set(sp.id, count ?? 0);
  }

  // 物种ID → 物种对象 查找表
  const spMap = new Map();
  for (const s of species) spMap.set(s.id, s);

  console.log(`=== 并行增量图片更新 ===`);
  console.log(`总物种: ${species.length} | 阈值: <${CONFIG.MIN_IMAGES_TO_TRIGGER} 张触发 | 上限: ${CONFIG.MAX_IMAGES_PER_SPECIES} 张/种`);
  console.log(`并行验证度: ${CONFIG.PARALLEL_VALIDATE} | 候选/请求: ${CONFIG.CANDIDATES_PER_REQUEST}`);
  console.log("---");

  let stats = { skipped: 0, fetched: 0, validated: 0, inserted: 0, errors: 0, alreadyEnough: 0 };
  const toProcess = []; // 需要处理的物种列表

  for (const sp of species) {
    const existing = existingCounts.get(sp.id) || 0;
    if (existing >= CONFIG.MIN_IMAGES_TO_TRIGGER) {
      stats.skipped++; stats.alreadyEnough++;
      continue;
    }
    toProcess.push(sp);
  }

  console.log(`\n需处理: ${toProcess.length} 种 | 跳过: ${stats.skipped}`);

  // ====== Phase 1: 并行获取所有候选 ======
  console.log("\n[Phase 1] 并行获取 GBIF 候选...");
  const candidateMap = new Map(); // speciesId -> candidates[]
  const fetchJobs = [];

  for (const sp of toProcess) {
    fetchJobs.push(
      fetchGbifCandidates(sp.name_lat).then((candidates) => {
        candidateMap.set(sp.id, candidates);
      }).catch((err) => {
        console.error(`  [FAIL] ${sp.name_lat}:`, err.message);
        stats.errors++;
        candidateMap.set(sp.id, []);
      })
    );
  }
  await Promise.all(fetchJobs);

  for (const [spId, cands] of candidateMap) {
    if (cands?.length > 0) stats.fetched += cands.length;
    else { stats.skipped++; console.log(`  [SKIP] ${spMap.get(spId)?.name_lat} — 无候选`); }
  }
  console.log(`  候选总数: ${stats.fetched}`);

  // ====== Phase 2: 并行验证 URL ======
  console.log(`\n[Phase 2] 并行验证 URL (${stats.fetched} 张)...`);
  const validMap = new Map(); // speciesId -> validated[]

  const validateBatches = [];
  for (const [spId, cands] of candidateMap) {
    if (!cands?.length) continue;
    const batch = [];
    for (const img of cands) {
      batch.push(validateImageUrl(img.url));
    }
    validateBatches.push(Promise.all(batch).then((results) => {
      const passed = [];
      for (let i = 0; i < results.length; i++) {
        if (results[i] && cands[i]) passed.push(cands[i]);
      }
      validMap.set(spId, passed);
    }));
  }
  await Promise.all(validateBatches);

  for (const [spId, cands] of candidateMap) {
    if (!cands?.length) continue;
    const v = validMap.get(spId) || [];
    stats.validated += v.length;
    if (v.length === 0) { stats.skipped++; console.log(`  [SKIP] ${spMap.get(spId)?.name_lat} — 全部无效`); continue; }
  }
  console.log(`  验证通过: ${stats.validated}/${stats.fetched}`);

  // ====== Phase 3: 并行入库 ======
  console.log(`\n[Phase 3] 并行入库...`);
  const insertJobs = [];

  for (const [spId, validImages] of validMap) {
    if (validImages.length === 0) { stats.skipped++; continue; }
    const toInsert = validImages.slice(0, CONFIG.MAX_IMAGES_PER_SPECIES);
    if (toInsert.length > 0) toInsert[0].is_primary = true;
    for (const img of toInsert) {
      img.species_id = spId;
      if (img.url.includes("inaturalist-open-data.s3")) img.thumbnail_url = img.url.replace("/medium.jpg", "/small.jpg");
    }

    insertJobs.push(
      sb.from("specimen_images").delete().eq("species_id", spId).then(() =>
        sb.from("specimen_images").insert(toInsert)
      ).then(() => {
        stats.inserted += toInsert.length;
      }).catch((err) => {
        console.error(`  [ERR] ${spMap.get(spId)?.name_lat}:`, err.message); stats.errors++;
      })
    );
  }
  await Promise.all(insertJobs);

  // ====== 统计 ======
  console.log("\n========== 最终统计 ==========");
  console.log(`物种总数:     ${species.length}`);
  console.log(`跳过(已足够):   ${stats.skipped}`);
  console.log(`GBIF 候选:     ${stats.fetched}`);
  console.log(`验证通过:       ${stats.validated}`);
  console.log(`新增入库:       ${stats.inserted}`);
  console.log(`错误:             ${stats.errors}`);

  // 查询入库后的实际数量
  const finalCounts = new Map();
  for (const sp of species) {
    const { count } = await sb.from("specimen_images").select("*", { count: "exact", head: true }).eq("species_id", sp.id);
    finalCounts.set(sp.id, count ?? 0);
  }
  let totalAfter = 0;
  for (const c of finalCounts.values()) totalAfter += c;

  console.log(`---------------------------`);
  console.log(`入库后总图片: ${totalAfter} 张`);

  for (const sp of species) {
    const t = finalCounts.get(sp.id) || 0;
    console.log(`  ${t > 0 ? "✅" : "✗"} ${sp.name_cn.padEnd(14)} ${sp.name_lat.padEnd(28)} ${t.toString().padStart(4)}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
