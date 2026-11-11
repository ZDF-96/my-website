import OpenAI from "openai";

// 让思考型模型有足够时间返回（Vercel 上默认 10s 会被截断）
export const maxDuration = 60;

// DeepSeek 配置全部从环境变量读取，避免密钥硬编码在代码里，也方便随时更换
const DEEPSEEK_API_KEY = (process.env.DEEPSEEK_API_KEY || "").trim();
const DEEPSEEK_BASE_URL = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").trim();
const DEEPSEEK_MODEL = (process.env.DEEPSEEK_MODEL || "deepseek-flash").trim();

const openai = DEEPSEEK_API_KEY
  ? new OpenAI({
      apiKey: DEEPSEEK_API_KEY,
      baseURL: DEEPSEEK_BASE_URL,
      timeout: 120_000,
    })
  : null;

export async function POST(request) {
  try {
    let messages;
    try {
      ({ messages } = await request.json());
    } catch {
      return Response.json(
        { code: "bad_json", error: "<p>请求体不是合法的 JSON，请刷新页面后重试。</p>" },
        { status: 400 }
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { code: "empty_messages", error: "<p>没有收到任何提问内容。</p>" },
        { status: 400 }
      );
    }

    // 2. 升级版系统人设
    const systemPrompt = {
      role: "system",
      content: "你是《物理宇宙》的首席物理导师。你拥有极度渊博的物理学、数学和天文学知识。解答问题时，你不仅保证学术上的绝对严谨，还喜欢旁征博引，常常穿插著名物理学家的轶事或经典的物理思想实验（如薛定谔的猫、麦克斯韦妖）来拓宽学生的视野。你的语气温和、深邃且富有启发性。⚠️极其重要的排版要求：1. 你的所有回答必须直接使用纯 HTML 标签（如 <p>, <br>, <strong>, <ul>, <li> 等）进行优美的排版。不要使用 Markdown！不要输出 ```html 这种代码块标记。2. 绝对禁止使用任何 LaTeX 语法（严禁出现 \\(, \\), \\[, \\], $,$$ 等符号）！3. 所有物理公式和数学符号必须使用普通的 Unicode 字符（如 ε₀, π, ⋅, ∫, ±）结合 HTML 的上下标标签（如 <sup>2</sup>, <sub>0</sub>）来书写。例如：库仑定律必须写成 E = q / (4πε₀r<sup>2</sup>)，确保普通中学生在网页上一眼就能看懂。"
    };

    const fullMessages = [systemPrompt, ...messages];

    // 3. 呼叫 DeepSeek 大模型
    if (!openai) {
      return Response.json(
        {
          code: "missing_api_key",
          error:
            '<p style="color:#f87171;">⚠️ 尚未配置 DeepSeek 密钥：请在项目根目录 <code>.env.local</code> 中写入 <code>DEEPSEEK_API_KEY=你的新密钥</code>，保存后重启开发服务器。</p>',
        },
        { status: 500 }
      );
    }

    const payload = {
      model: DEEPSEEK_MODEL,
      messages: fullMessages,
      max_tokens: 4096,
    };
    // deepseek-reasoner 不支持采样参数，传了可能报 400
    if (!/reasoner/i.test(DEEPSEEK_MODEL)) payload.temperature = 0.5;

    const response = await openai.chat.completions.create(payload);

    return Response.json({ reply: response.choices[0].message.content });
    
  } catch (error) {
    // 把上游真实原因翻译成人话：401=Key 失效，402=余额不足，429=限流……
    const status = error?.status ?? error?.response?.status ?? 0;
    const raw = String(error?.message || error || "");
    const requestId = error?.request_id || error?.headers?.["x-request-id"] || "";

    console.error("[DeepSeek] 调用失败", { status, requestId, model: DEEPSEEK_MODEL, message: raw });

    let code = "upstream_error";
    let message;

    if (status === 401) {
      code = "invalid_api_key";
      message =
        "DeepSeek 密钥无效或已被停用（账户余额可能仍然存在，但 Key 已失效）。请到 platform.deepseek.com/api_keys 重新生成密钥，写入 .env.local 的 DEEPSEEK_API_KEY 后重启服务。";
    } else if (status === 402) {
      code = "insufficient_balance";
      message = "DeepSeek 账户余额不足，请充值后重试。";
    } else if (status === 429) {
      code = "rate_limited";
      message = "DeepSeek 请求过于频繁（限流），请稍后再试。";
    } else if (status === 400) {
      code = "bad_request";
      message = `DeepSeek 拒绝了这次请求（HTTP 400）：${raw.slice(0, 160)}`;
    } else if (status >= 500) {
      message = `DeepSeek 服务端暂时不可用（HTTP ${status}），请稍后重试。`;
    } else if (/timeout|ETIMEDOUT|ECONNRESET|fetch failed|socket hang up/i.test(raw)) {
      code = "network_error";
      message = "连接 DeepSeek 超时或网络中断，请稍后重试。";
    } else {
      message = `AI 接口调用失败（HTTP ${status || "未知"}）：${raw.slice(0, 160)}`;
    }

    return Response.json(
      {
        code,
        status,
        error: `<p style="color:#f87171;">⚠️ ${message}</p>`,
      },
      { status: 502 }
    );
  }
}