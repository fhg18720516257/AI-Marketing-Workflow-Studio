import type { CopyVariant, ExtractedInput, KvVariant, NodeId, VideoVariant } from '../types/workflow';

function splitKeywords(text: string) {
  return text
    .split(/[，,、。；;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function pickValue(text: string, keys: string[]) {
  for (const key of keys) {
    const match = text.match(new RegExp(`${key}[：: ]([^。；;\n]+)`));
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

function inferCategory(productName: string) {
  if (/短袖|T恤|衣|裙|裤|服/.test(productName)) return '服饰穿搭';
  if (/鞋|靴|拖鞋/.test(productName)) return '鞋履';
  if (/包|箱|背包|斜挎/.test(productName)) return '箱包配饰';
  if (/杯|壶|锅|家居|收纳/.test(productName)) return '家居生活';
  if (/面霜|精华|口红|香水|护肤|彩妆/.test(productName)) return '美妆个护';
  if (/手机|耳机|电脑|键盘|智能/.test(productName)) return '数码科技';
  return '综合消费品';
}

function localExtractInput(inputText: string): ExtractedInput {
  const productName = pickValue(inputText, ['商品', '产品', '名称']) || splitKeywords(inputText)[0] || '未命名商品';
  const campaignName = pickValue(inputText, ['活动', '促销', '优惠']) || (inputText.includes('618') ? '618 限时活动' : inputText.includes('双11') ? '双 11 大促' : '限时营销活动');
  const sellingPointRaw = pickValue(inputText, ['卖点', '亮点', '特点', '优势']);
  const audience = pickValue(inputText, ['目标用户', '人群', '受众']) || '关注品质、实用性和性价比的潜在消费者';
  const sellingPoints = sellingPointRaw ? splitKeywords(sellingPointRaw) : splitKeywords(inputText).slice(1, 6);

  return {
    raw: inputText,
    productName,
    productCategory: inferCategory(productName),
    campaignName,
    campaignSummary: campaignName,
    audience,
    sellingPoints: sellingPoints.length ? sellingPoints : ['高颜值', '实用', '高性价比'],
    keywords: splitKeywords(`${productName}，${campaignName}，${sellingPoints.join('，')}`),
    tone: /高端|质感|轻奢/.test(inputText) ? '高级质感' : /直播|抢购|限时/.test(inputText) ? '强转化促销' : '清晰、有吸引力、偏电商营销',
  };
}

export function buildCopywritingPrompt(input: ExtractedInput, template: string) {
  return `只输出合法 JSON，不要 Markdown。你是电商营销文案专家。\n节点模板:${template}\n商品:${JSON.stringify(input)}\n生成3版中文营销文案，分别偏种草、强转化、情绪价值。格式:{"versionA":{"title":"","style":"","headline":"","body":"80字以内","cta":"","tags":[""]},"versionB":{"title":"","style":"","headline":"","body":"80字以内","cta":"","tags":[""]},"versionC":{"title":"","style":"","headline":"","body":"80字以内","cta":"","tags":[""]}}`;
}

export function buildKvPrompt(input: ExtractedInput, copywriting: CopyVariant[], template: string) {
  return `只输出合法 JSON，不要 Markdown。你是电商视觉提示词专家。\n节点模板:${template}\n商品:${JSON.stringify(input)}\n文案:${JSON.stringify(copywriting)}\n生成3版KV，每版包含中文concept和英文Midjourney prompt。格式:{"versionA":{"title":"","concept":"","prompt":"English prompt under 70 words","negativePrompt":""},"versionB":{"title":"","concept":"","prompt":"English prompt under 70 words","negativePrompt":""},"versionC":{"title":"","concept":"","prompt":"English prompt under 70 words","negativePrompt":""}}`;
}

export function buildVideoPrompt(input: ExtractedInput, copywriting: CopyVariant, template: string) {
  return `只输出合法 JSON，不要 Markdown。你是短视频分镜专家。\n节点模板:${template}\n商品:${JSON.stringify(input)}\n选中文案:${JSON.stringify(copywriting)}\n生成3版短视频脚本，每版3个镜头即可，控制简洁。格式:{"versionA":{"title":"","rhythm":"","totalDuration":"15s","shots":[{"shot":"镜头1","duration":"0-5s","visual":"","voiceover":""}]},"versionB":{"title":"","rhythm":"","totalDuration":"20s","shots":[{"shot":"镜头1","duration":"0-6s","visual":"","voiceover":""}]},"versionC":{"title":"","rhythm":"","totalDuration":"30s","shots":[{"shot":"镜头1","duration":"0-10s","visual":"","voiceover":""}]}}`;
}

export type CombinedTemplates = {
  copywriting: string;
  kvPrompt: string;
  videoScript: string;
};

export type CombinedGenerateResult = {
  copywriting: CopyVariant[];
  kvPrompt: KvVariant[];
  videoScript: VideoVariant[];
};

export function buildCombinedPrompt(input: ExtractedInput, templates: CombinedTemplates, copywriting?: CopyVariant[]) {
  const selectedCopy = copywriting?.[0];
  return `只输出合法 JSON，不要 Markdown。你是电商营销全流程专家，一次生成文案、KV 视觉提示词与短视频分镜。

商品 Brief:
${JSON.stringify(input)}

【文案节点模板】${templates.copywriting}
生成 3 版中文营销文案（种草 / 强转化 / 情绪价值），放入 copywriting.versionA/B/C，每版含 title、style、headline、body（80字内）、cta、tags。

【KV 节点模板】${templates.kvPrompt}
基于商品与文案，生成 3 版 KV，放入 kvPrompt.versionA/B/C，每版含 title、concept、prompt（英文 70 词内）、negativePrompt。

【视频节点模板】${templates.videoScript}
基于商品与文案${selectedCopy ? `（参考：${JSON.stringify(selectedCopy)}）` : ''}，生成 3 版短视频脚本，放入 videoScript.versionA/B/C，每版含 title、rhythm、totalDuration、shots（每版 3 镜头，含 shot、duration、visual、voiceover）。

严格按以下顶层结构输出，不要多余字段：
{"copywriting":{"versionA":{},"versionB":{},"versionC":{}},"kvPrompt":{"versionA":{},"versionB":{},"versionC":{}},"videoScript":{"versionA":{},"versionB":{},"versionC":{}}}`;
}

type ApiSettings = { apiKey: string; baseUrl: string; modelName: string };

type GeneratePayload = {
  inputText: string;
  input?: ExtractedInput;
  copywriting?: CopyVariant[];
  selectedCopy?: CopyVariant;
  template: string;
  settings: ApiSettings;
  onToken?: (text: string) => void;
};

function buildPrompt(kind: NodeId, payload: GeneratePayload) {
  if (kind === 'copywriting') return buildCopywritingPrompt(payload.input as ExtractedInput, payload.template);
  if (kind === 'kvPrompt') return buildKvPrompt(payload.input as ExtractedInput, payload.copywriting ?? [], payload.template);
  return buildVideoPrompt(payload.input as ExtractedInput, payload.selectedCopy as CopyVariant, payload.template);
}

function parseSseLine(line: string) {
  if (!line.startsWith('data:')) return '';
  const data = line.slice(5).trim();
  if (!data || data === '[DONE]') return '';
  try {
    const json = JSON.parse(data);
    return json?.choices?.[0]?.delta?.content ?? json?.choices?.[0]?.message?.content ?? '';
  } catch {
    return '';
  }
}

async function requestOpenAICompatibleStream(prompt: string, settings: ApiSettings, onToken?: (text: string) => void, timeoutMs = 120_000) {
  if (!settings.apiKey.trim()) throw new Error('API Key 未配置，请先在设置中填写。');

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${settings.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.modelName,
        messages: [
          { role: 'system', content: '你只输出合法 JSON，不输出 Markdown，不输出解释。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.45,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
        stream: true,
      }),
    });

    if (!response.ok) throw new Error(`API 请求失败：${response.status} ${response.statusText}`);
    if (!response.body) throw new Error('当前浏览器不支持流式响应。');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullText = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const token = parseSseLine(line.trim());
        if (!token) continue;
        fullText += token;
        onToken?.(fullText);
      }
    }

    if (!fullText.trim()) throw new Error('模型返回为空');
    try {
      return JSON.parse(fullText.trim());
    } catch {
      throw new Error('模型返回内容不是合法 JSON。请重试，或把 Prompt 改得更短、更明确。');
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error(`请求超过 ${Math.round(timeoutMs / 1000)} 秒，已自动终止。建议换更快模型或减少输出长度。`);
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function generateWithApi(kind: NodeId, payload: GeneratePayload) {
  if (kind === 'input') {
    const input = localExtractInput(payload.inputText);
    payload.onToken?.(JSON.stringify(input, null, 2));
    return input;
  }
  return requestOpenAICompatibleStream(buildPrompt(kind, payload), payload.settings, payload.onToken);
}

type GenerateAllPayload = {
  inputText: string;
  input: ExtractedInput;
  copywriting?: CopyVariant[];
  templates: CombinedTemplates;
  settings: ApiSettings;
  onToken?: (text: string) => void;
};

export async function generateAllWithApi(payload: GenerateAllPayload): Promise<CombinedGenerateResult> {
  const prompt = buildCombinedPrompt(payload.input, payload.templates, payload.copywriting);
  const raw = await requestOpenAICompatibleStream(prompt, payload.settings, payload.onToken);
  return normalizeCombinedOutput(raw);
}

export function normalizeCombinedOutput(output: unknown): CombinedGenerateResult {
  const data = output as Record<string, unknown>;
  return {
    copywriting: normalizeCopywriting(data.copywriting ?? data),
    kvPrompt: normalizeKvPrompt(data.kvPrompt ?? data),
    videoScript: normalizeVideoScript(data.videoScript ?? data),
  };
}

export function normalizeCopywriting(output: any) {
  return [output.versionA, output.versionB, output.versionC].filter(Boolean) as CopyVariant[];
}

export function normalizeKvPrompt(output: any) {
  return [output.versionA, output.versionB, output.versionC].filter(Boolean) as KvVariant[];
}

export function normalizeVideoScript(output: any) {
  return [output.versionA, output.versionB, output.versionC].filter(Boolean) as VideoVariant[];
}
