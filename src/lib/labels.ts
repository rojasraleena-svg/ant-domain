/**
 * 统一标签翻译映射
 * 数据库中存储英文 key，前端显示中文
 */

// ========== 生活阶段 ==========
export const STAGE_LABELS: Record<string, string> = {
  nuptial_flight: "婚飞",
  nesting: "建巢",
  egg: "卵期",
  larva: "幼虫期",
  pupa: "蛹期",
  first_workers: "首批工蚁",
  early_growth: "初级扩群",
  steady_growth: "稳定增长",
  mature: "成熟群体",
  hibernation: "冬眠",
};

// ========== 异常类型 ==========
export const ABNORMAL_LABELS: Record<string, string> = {
  death: "死亡",
  escape: "逃逸",
  disease: "病害/异常",
  other: "其他异常",
  none: "",
};

// ========== 食性 ==========
export const DIET_LABELS: Record<string, string> = {
  omnivore: "杂食性",
  carnivore: "肉食性",
  sugar_feeder: "甜食偏好",
};

// ========== 巢型（支持组合值如 "test_tube / gypsum"） ==========
export const NEST_TYPE_LABELS: Record<string, string> = {
  test_tube: "试管",
  gypsum: "石膏板",
  plaster: "石膏",
  acrylic: "亚克力",
  "3d_printed": "3D 打印",
  plant: "生态缸/植物巢",
  nesting: "正在筑巢中",
};

// ========== 便捷函数 ==========

/** 翻译阶段 */
export function getStageLabel(stage: string | null | undefined): string {
  if (!stage) return "";
  return STAGE_LABELS[stage] || stage;
}

/** 翻译异常类型 */
export function getAbnormalLabel(type: string | null | undefined): string {
  if (!type || type === "none") return "";
  return ABNORMAL_LABELS[type] || type;
}

/** 翻译食性 */
export function getDietLabel(diet: string | null | undefined): string {
  if (!diet) return "";
  return DIET_LABELS[diet] || diet;
}

/** 翻译巢型（支持 "a / b / c" 格式） */
export function getNestTypeLabel(nestType: string | null | undefined): string {
  if (!nestType) return "";
  if (NEST_TYPE_LABELS[nestType]) return NEST_TYPE_LABELS[nestType];
  return nestType
    .split(/\s*\/\s*/)
    .map((t) => NEST_TYPE_LABELS[t.trim()] || t.trim())
    .join(" / ");
}
