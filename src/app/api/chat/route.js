import OpenAI from "openai";

// 1. 初始化唯一的主力 AI 客户端：DeepSeek
const openai = new OpenAI({
  apiKey: "sk-66f64767782047dd848df8ff8e5ef048", // ⚠️ 你的 DeepSeek 真实 Key
  baseURL: "https://api.deepseek.com", 
});

export async function POST(request) {
  try {
    const { messages } = await request.json();

    // 2. 升级版系统人设
    const systemPrompt = {
      role: "system",
      content: "你是《物理宇宙》的首席物理导师。你拥有极度渊博的物理学、数学和天文学知识。解答问题时，你不仅保证学术上的绝对严谨，还喜欢旁征博引，常常穿插著名物理学家的轶事或经典的物理思想实验（如薛定谔的猫、麦克斯韦妖）来拓宽学生的视野。你的语气温和、深邃且富有启发性。⚠️极其重要的排版要求：1. 你的所有回答必须直接使用纯 HTML 标签（如 <p>, <br>, <strong>, <ul>, <li> 等）进行优美的排版。不要使用 Markdown！不要输出 ```html 这种代码块标记。2. 绝对禁止使用任何 LaTeX 语法（严禁出现 \\(, \\), \\[, \\], $,$$ 等符号）！3. 所有物理公式和数学符号必须使用普通的 Unicode 字符（如 ε₀, π, ⋅, ∫, ±）结合 HTML 的上下标标签（如 <sup>2</sup>, <sub>0</sub>）来书写。例如：库仑定律必须写成 E = q / (4πε₀r<sup>2</sup>)，确保普通中学生在网页上一眼就能看懂。"
    };

    const fullMessages = [systemPrompt, ...messages];

    // 3. 呼叫 DeepSeek 大模型
const response = await openai.chat.completions.create({
  model: "deepseek-reasoner", // 👈 将这里从 "deepseek-chat" 改为 "deepseek-reasoner"
  messages: fullMessages,
  temperature: 0.5, 
});

    return Response.json({ reply: response.choices[0].message.content });
    
  } catch (error) {
    console.error("DeepSeek 接口报错:", error);
    
    // 🚀 核心修改：去掉了充值按钮，只保留干净的错误提示
    const errorHtml = `<p style="color: #ef4444;">⚠️ 警告：物理宇宙节点的算力已耗尽（AI 接口余额不足或网络失联）。请联系管理员充值后重试。</p>`;

    return Response.json({ error: errorHtml }, { status: 500 });
  }
}