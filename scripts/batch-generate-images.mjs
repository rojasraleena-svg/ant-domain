/**
 * 批量为所有物种生成 AI 插图
 * 用法: node scripts/batch-generate-images.mjs
 */
const API_KEY = "ant_ae781a66f9eb146c11ff8378f28b5d0830023df20fc7f828";
const API_URL = "https://ant.gqy20.top/api/generate-image";

const VIEWS = ["dorsal", "lateral"];
const STYLES = ["scientific", "macro_photo", "watercolor", "realistic"];
const CASTES = ["worker", "queen"];

// 物种列表
const SPECIES = [
  { id: 1, nameCn: "日本弓背蚁", nameLat: "Camponotus japonicus" },
  { id: 2, nameCn: "尼科巴弓背蚁", nameLat: "Camponotus nicobarensis" },
  { id: 3, nameCn: "史密斯弓背蚁", nameLat: "Camponotus smithi" },
  { id: 4, nameCn: "费氏弓背蚁", nameLat: "Camponotus festinus" },
  { id: 5, nameCn: "宽结弓背蚁", nameLat: "Camponotus tortuganus" },
  { id: 6, nameCn: "拟黑多刺蚁", nameLat: "Polyrhachis dives" },
  { id: 7, nameCn: "双齿多刺蚁", nameLat: "Polyrhachis lamellidens" },
  { id: 8, nameCn: "亮毛蚁", nameLat: "Formica fusca" },
  { id: 9, nameCn: "血红林蚁", nameLat: "Formica sanguinea" },
  { id: 10, nameCn: "日本蚁", nameLat: "Formica japonica" },
  { id: 11, nameCn: "丝毛蚁", nameLat: "Formica yessensis" },
  { id: 12, nameCn: "深色蚁", nameLat: "Formica gagates" },
  { id: 13, nameCn: "黄肢立毛蚁", nameLat: "Paratrechina flavipes" },
  { id: 14, nameCn: "长角立毛蚁", nameLat: "Paratrechina longicornis" },
  { id: 15, nameCn: "疯狂立毛蚁", nameLat: "Paratrechina vaga" },
  { id: 16, nameCn: "白斑弓背蚁", nameLat: "Camponotus albosparsus" },
  { id: 17, nameCn: "金腹弓背蚁", nameLat: "Camponotus auriventris" },
  { id: 18, nameCn: "压缩弓背蚁", nameLat: "Camponotus compressus" },
  { id: 19, nameCn: "单一弓背蚁", nameLat: "Camponotus singularis" },
  { id: 20, nameCn: "哈氏弓背蚁", nameLat: "Camponotus habereri" },
  { id: 21, nameCn: "黄毛蚁", nameLat: "Lasius flavus" },
  { id: 50, nameCn: "全异巨首蚁", nameLat: "Pheidole megacephala" },
  { id: 22, nameCn: "黑毛蚁", nameLat: "Lasius niger" },
  { id: 51, nameCn: "结节大头蚁", nameLat: "Pheidole noda" },
  { id: 23, nameCn: "亮毛蚁", nameLat: "Lasius fuliginosus" },
  { id: 52, nameCn: "中华大头蚁", nameLat: "Pheidole sinensis" },
  { id: 24, nameCn: "头状毛蚁", nameLat: "Lasius capitatus" },
  { id: 53, nameCn: "印度大头蚁", nameLat: "Pheidole indica" },
  { id: 25, nameCn: "黄猄蚁", nameLat: "Oecophylla smaragdina" },
  { id: 54, nameCn: "法老铺道蚁", nameLat: "Tetramorium caespitum" },
  { id: 26, nameCn: "武装多刺蚁", nameLat: "Polyrhachis armata" },
  { id: 55, nameCn: "对马铺道蚁", nameLat: "Tetramorium tsushimae" },
  { id: 27, nameCn: "驼背多刺蚁", nameLat: "Polyrhachis gibbosa" },
  { id: 56, nameCn: "immigrant 铺道蚁", nameLat: "Tetramorium immigrans" },
  { id: 28, nameCn: "侏儒矮蚁", nameLat: "Plagiolepis pygmaea" },
  { id: 57, nameCn: "日本举腹蚁", nameLat: "Crematogaster japonica" },
  { id: 58, nameCn: "罗氏举腹蚁", nameLat: "Crematogaster rogenhoferi" },
  { id: 59, nameCn: "野蛮收获蚁", nameLat: "Messor barbarus" },
  { id: 60, nameCn: "针毛收获蚁", nameLat: "Messor structor" },
  { id: 61, nameCn: "法老小家蚁", nameLat: "Monomorium pharaonis" },
  { id: 62, nameCn: "入侵小家蚁", nameLat: "Monomorium intrudens" },
  { id: 63, nameCn: "小火蚁/热带火蚁", nameLat: "Solenopsis geminata" },
  { id: 64, nameCn: "日本盘腹蚁", nameLat: "Aphaenogaster japonica" },
  { id: 65, nameCn: "双色滑胸蚁", nameLat: "Meranoplus bicolor" },
  { id: 66, nameCn: "弯曲瘦蚁", nameLat: "Temnothorax curvispinosus" },
  { id: 67, nameCn: "中华颚蚁", nameLat: "Strumigenys membranifera" },
];

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateImage(spec, view, style, caste) {
  const body = {
    mode: "ant",
    nameCn: spec.nameCn,
    nameLat: spec.nameLat,
    view,
    style,
    caste,
    n: 1,
    speciesId: spec.id,
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  const data = await res.json();
  return { status: res.status, data };
}

async function main() {
  const total = SPECIES.length;
  let success = 0;
  let fail = 0;

  console.log("=============================================");
  console.log("开始批量生成 AI 插图");
  console.log(`物种总数: ${total}`);
  console.log(`API: ${API_URL}`);
  console.log(`时间: ${new Date().toLocaleString("zh-CN")}`);
  console.log("=============================================\n");

  for (let i = 0; i < SPECIES.length; i++) {
    const spec = SPECIES[i];
    const vIdx = i % VIEWS.length;
    const sIdx = i % STYLES.length;
    const cIdx = i % CASTES.length;

    console.log(`[${i + 1}/${total}] ${spec.nameCn} (${spec.nameLat})`);
    console.log(`  参数: view=${VIEWS[vIdx]} style=${STYLES[sIdx]} caste=${CASTES[cIdx]}`);

    try {
      const { status, data } = await generateImage(
        spec,
        VIEWS[vIdx],
        STYLES[sIdx],
        CASTES[cIdx]
      );

      if (status === 200) {
        const count = data.successCount || 0;
        if (count > 0) {
          console.log(`  ✅ 成功 (${count} 张)`);
          success++;
        } else {
          console.log(`  ⚠️ 返回成功但无图片`);
          fail++;
        }
      } else if (status === 429) {
        console.log(`  ⏳️ 限流，等待 15 秒...`);
        await sleep(15_000);
        const retry = await generateImage(spec, VIEWS[vIdx], STYLES[sIdx], CASTES[cIdx]);
        if (retry.status === 200) {
          const count = retry.data?.successCount || 0;
          console.log(`  ✅ 重试成功 (${count} 张)`);
          success++;
        } else {
          console.log(`  ❌ 重试失败 (${retry.status})`);
          fail++;
        }
      } else {
        const errBody = JSON.stringify(data).slice(0, 200);
        console.log(`  ❌ 失败 (${status}): ${errBody}`);
        fail++;
      }
    } catch (err) {
      console.log(`  ❌ 网络错误: ${err.message}`);
      fail++;
    }

    // 间隔 2 秒
    await sleep(2000);
  }

  console.log("\n=============================================");
  console.log("批量生成完成!");
  console.log(`✅ 成功: ${success}`);
  console.log(`❌ 失败: ${fail}`);
  console.log(`成功率: ${Math.round((success / total) * 100)}%`);
  console.log(`完成时间: ${new Date().toLocaleString("zh-CN")}`);
  console.log("=============================================");
}

main().catch(console.error);
