import Anthropic from "@anthropic-ai/sdk";

// ============================================
// AI 服务封装 — 基于 Claude API
// 所有调用均在服务端执行，API Key 不暴露给浏览器
// ============================================

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com",
});

/** 日志摘要请求参数 */
export interface SummarizeLogInput {
  /** 蚁群名称 */
  colonyName: string;
  /** 物种名称 */
  speciesName: string;
  /** 当前阶段（如有） */
  currentStage?: string;
  /** 本次日志标题 */
  title: string;
  /** 本次日志正文 */
  content: string;
  /** 工蚁数量变化 */
  workerCount?: string;
  /** 卵/幼虫/蛹状态 */
  eggStatus?: string;
  larvaStatus?: string;
  pupaStatus?: string;
  /** 喂食记录 */
  feedingRecord?: string;
  /** 温湿度 */
  temperature?: number | null;
  humidity?: number | null;
  /** 异常情况 */
  abnormalType?: string | null;
}

/** 日志摘要结果 */
export interface SummarizeLogResult {
  /** 一句话摘要 */
  summary: string;
  /** 推断的当前阶段（可能为空） */
  inferredStage?: string;
  /** 风险提示（无风险则为空） */
  riskAlert?: string | undefined;
  /** 下一步建议 */
  nextSteps: string[];
}

/**
 * 生成日志摘要 + 阶段判断 + 风险检测 + 建议
 * 这是核心 AI 功能，一次调用返回多个维度的分析
 */
export async function summarizeLog(
  input: SummarizeLogInput
): Promise<SummarizeLogResult> {
  const systemPrompt = `你是一个专业的蚂蚁养殖助手"蚁域AI"。你的任务是根据用户的蚁群饲养日志，生成简洁有用的分析。

你需要做以下几件事：
1. **生成一句话摘要**：用一句话概括这次观察的核心内容
2. **推断当前阶段**：根据日志内容判断蚁群可能处于哪个生活史阶段（婚飞/建巢/卵期/幼虫期/蛹期/首批工蚁羽化/初级扩群/稳定增长/成熟群体/冬眠）
3. **风险检测**：如果发现异常情况（死亡、逃逸、病害、长期不产卵、停止进食等），给出风险提示；如果正常则不输出此项
4. **下一步建议**：给出1-2条具体的、可操作的建议

回复格式要求：
- 使用中文
- 摘要控制在30字以内
- 阶段判断要明确说明理由
- 建议要具体可操作
- 不要过度解读，不确定就说不确定
- 不要使用 markdown 格式`;

  const userMessage = formatLogForAI(input);

  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "glm-5v-turbo",
    max_tokens: 500,
    system: [{ type: "text", text: systemPrompt }],
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  return parseAIResponse(text);
}

/** 蚁群成长周报输入 */
export interface WeeklyReportInput {
  colonyName: string;
  speciesName: string;
  currentStage?: string;
  logs: Array<{
    date: string;
    title: string;
    content: string;
    workerCount?: string;
    abnormalType?: string | null;
  }>;
}

/** 成长周报结果 */
export interface WeeklyReportResult {
  summary: string;
  stageAssessment: string;
  highlights: string[];
  risks: string[];
  suggestions: string[];
}

/**
 * 生成成长周报 — 汇总一周或多天的日志
 */
export async function generateWeeklyReport(
  input: WeeklyReportInput
): Promise<WeeklyReportResult> {
  const systemPrompt = `你是一个专业的蚂蚁养殖助手"蚁域AI"。根据用户一周的蚁群饲养日志，生成一份简洁的成长周报。

需要包含：
1. **本周总结**：2-3句话概括本周主要发生了什么
2. **阶段评估**：当前处于什么阶段，相比上周有无进展
3. **亮点事件**：列出1-2个值得关注的积极进展
4. **风险提醒**：如有异常及时提醒
5. **下周建议**：1-2条针对性建议

要求：中文、简洁、实用、不要过度解读。`;

  const logText = input.logs
    .map(
      (log) =>
        `[${log.date}] ${log.title}：${log.content}${
          log.workerCount ? `（工蚁${log.workerCount}）` : ""
        }${log.abnormalType ? `【异常：${log.abnormalType}】` : ""}`
    )
    .join("\n");

  const userMessage = `蚁群名称：${input.colonyName}
物种：${input.speciesName}
${input.currentStage ? `当前阶段：${input.currentStage}` : ""}

本周日志：
${logText}`;

  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "glm-5v-turbo",
    max_tokens: 800,
    system: [{ type: "text", text: systemPrompt }],
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  // 解析结构化响应
  return {
    summary: extractSection(text, "本周总结") || text.slice(0, 200),
    stageAssessment:
      extractSection(text, "阶段评估") || "",
    highlights: extractList(text, "亮点"),
    risks: extractList(text, "风险"),
    suggestions: extractList(text, "建议") || ["继续保持观察"],
  };
}

/**
 * 根据蚁群状态生成个性化建议（用于蚁群详情页）
 */
export async function generateColonyAdvice(
  colonyName: string,
  speciesName: string,
  currentStage: string | null,
  recentLogs: Array<{ title: string; content: string; date: string }> = []
): Promise<string[]> {
  const systemPrompt = `你是一个专业的蚂蚁养殖助手。根据蚁群的当前状态和近期日志，给出2-3条简短实用的建议。
每条建议一行，直接可操作。中文回答。`;

  const logSummary = recentLogs.length
    ? recentLogs
        .map((l) => `[${l.date}] ${l.title}`)
        .join("；")
    : "暂无日志";

  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "glm-5v-turbo",
    max_tokens: 300,
    system: [{ type: "text", text: systemPrompt }],
    messages: [
      {
        role: "user",
        content: `蚁群：${colonyName}\n物种：${speciesName}\n${
          currentStage ? `当前阶段：${currentStage}\n` : ""
        }近期日志：${logSummary || "暂无"}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return text.split("\n").filter((line) => line.trim().length > 0).slice(0, 3);
}

// ============================================
// 内部工具函数
// ============================================

function formatLogForAI(input: SummarizeLogInput): string {
  const parts = [
    `蚁群名称：${input.colonyName}`,
    `物种：${input.speciesName}`,
    `日志标题：${input.title}`,
    `日志内容：${input.content}`,
  ];

  if (input.currentStage) parts.push(`当前阶段：${input.currentStage}`);
  if (input.workerCount) parts.push(`工蚁数量：${input.workerCount}`);
  if (input.eggStatus) parts.push(`卵状态：${input.eggStatus}`);
  if (input.larvaStatus) parts.push(`幼虫状态：${input.larvaStatus}`);
  if (input.pupaStatus) parts.push(`蛹状态：${input.pupaStatus}`);
  if (input.feedingRecord) parts.push(`喂食：${input.feedingRecord}`);
  if (input.temperature) parts.push(`温度：${input.temperature}°C`);
  if (input.humidity) parts.push(`湿度：${input.humidity}%`);
  if (input.abnormalType) parts.push(`⚠️ 异常：${input.abnormalType}`);

  return parts.join("\n");
}

function parseAIResponse(text: string): SummarizeLogResult {
  // 简单解析：尝试从文本中提取结构化信息
  const summary = extractSection(text, "摘要") || text.slice(0, 100);
  const inferredStage = extractStage(text);
  const riskAlert = extractSection(text, "风险") ?? undefined;
  const nextStepsArr = extractList(text, "建议");
  const nextSteps = nextStepsArr.length > 0 ? nextStepsArr : ["继续保持观察"];

  return { summary, inferredStage, riskAlert, nextSteps } as unknown as SummarizeLogResult;
}

function extractSection(text: string, keyword: string): string | undefined {
  // 尝试匹配 "关键词：内容" 或 "关键词\n内容" 格式
  const patterns = [
    new RegExp(`${keyword}[：:\\s]*([^\\n]+)`, "i"),
    new RegExp(`${keyword}\\s*\\n([\\s\\S]+?)(?=\\n(?:阶段|风险|建议|摘要|$))`, "i"),
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return undefined;
}

function extractList(text: string, keyword: string): string[] {
  const section = extractSection(text, keyword);
  if (!section) return [];
  const rawItems = section.split(/[\n、;，]/);
  const result: string[] = [];
  for (const item of rawItems) {
    const s = item.replace(/^[\d\.\[\]]*[-·]/, "").trim();
    if (s.length > 0) result.push(s);
  }
  return result;
}

function extractStage(text: string): string | undefined {
  // 从文本中查找阶段关键词
  const stages = [
    "婚飞",
    "建巢",
    "创巢",
    "卵期",
    "幼虫期",
    "蛹期",
    "首批工蚁",
    "第一批工蚁",
    "初级扩群",
    "稳定增长",
    "成熟群体",
    "冬眠",
    "hibernation",
  ];

  for (const stage of stages) {
    if (text.includes(stage)) {
      // 找到对应的英文 key
      const stageMap: Record<string, string> = {
        婚飞: "nuptial_flight",
        建巢: "nesting",
        创巢: "nesting",
        卵期: "egg",
        幼虫期: "larva",
        蛹期: "pupa",
        首批工蚁: "first_workers",
        第一批工蚁: "first_workers",
        初级扩群: "early_growth",
        稳定增长: "steady_growth",
        成熟群体: "mature",
        冬眠: "hibernation",
      };
      const found = stageMap[stage];
      if (found) return found;
    }
  }
  return undefined;
}
