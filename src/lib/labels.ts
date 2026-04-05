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
  // 基础巢型
  test_tube: "试管",
  gypsum: "石膏板",
  plaster: "石膏",
  acrylic: "亚克力",
  "3d_printed": "3D 打印",
  plant: "生态缸/植物巢",
  nesting: "正在筑巢中",
  soil: "土巢",

  // 蚁巢类型 (formicarium 系列)
  formicarium: "蚁巢",
  chambered_formicarium: "室式蚁巢",
  desert_formicarium: "沙漠蚁巢",
  urban_formicarium: "城市蚁巢",
  micro_formicarium: "微型蚁巢",
  locked_formicarium: "封闭式蚁巢",

  // 土壤/自然巢型
  deep_soil: "深层土巢",
  wood_mixed: "木质混合巢",
  branch_nest: "枝条巢",
  arboreal_formicarium: "树栖蚁巢",

  // 亚克力/试管变体
  small_acrylic: "小型亚克力",
  large_gypsum: "大型石膏板",
  small_test_tube: "小型试管",
  tiny_test_tube: "超小型试管",
  tiny_tube: "微型试管",
  tiny_container: "微型容器",
  tube_with_wood: "含木试管",

  // 自然/土壤环境
  natural: "自然巢",
  shallow_soil: "浅层土巢",
  leaf_litter: "枯叶层",
  wood: "木质巢",
  arboreal: "树栖",

  // 特殊生境
  humid_microhabitat: "潮湿微生境",
  prey_rich: "猎物丰富环境",
  micro_cavity: "微型空腔",
  secure_gypsum: "加固石膏板",
  any: "均可",
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
