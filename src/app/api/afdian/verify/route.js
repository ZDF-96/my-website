import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const body = await request.json();
    const { out_trade_no } = body;
    console.log("\n==================================");
    console.log("👉 1. 收到前端查单请求，订单号:", out_trade_no);

    if (!out_trade_no) {
      return NextResponse.json({ success: false, message: '订单号不能为空' }, { status: 400 });
    }

    // ==========================================
    // ⚠️ 极其重要：把下面这两行换成你自己的爱发电凭证！
    // ==========================================
    const user_id = '这里填你的user_id'; // 请换成真实的
    const token = '这里填你的token';     // 请换成真实的

    console.log("👉 2. 正在生成加密签名...");
    const params = JSON.stringify({ out_trade_no });
    const ts = Math.floor(Date.now() / 1000); 

    const signString = `${token}params${params}ts${ts}user_id${user_id}`;
    const sign = crypto.createHash('md5').update(signString).digest('hex');

    console.log("👉 3. 准备向爱发电发送请求...");
    const afdianRes = await fetch('https://afdian.net/api/open/query-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id,
        params,
        ts,
        sign
      })
    });

    console.log("👉 4. 爱发电服务器 HTTP 状态码:", afdianRes.status);
    
    // 先用 text() 读取，防止爱发电返回了非 JSON 的错误网页导致崩溃
    const rawText = await afdianRes.text();
    console.log("👉 5. 爱发电返回的原始数据:", rawText);

    const afdianData = JSON.parse(rawText);

    if (afdianData.ec === 200) {
      const list = afdianData.data.list;
      if (list && list.length > 0 && list[0].out_trade_no === out_trade_no) {
        console.log("✅ 验证成功！");
        return NextResponse.json({ success: true, message: '验证成功！' });
      } else {
        console.log("❌ 验证失败：订单号不匹配或未查到");
        return NextResponse.json({ success: false, message: '未查到该订单的付款记录，请检查是否输错。' }, { status: 404 });
      }
    } else {
      console.log("❌ 验证失败：爱发电接口报错", afdianData.em);
      return NextResponse.json({ success: false, message: afdianData.em || '爱发电接口报错' }, { status: 400 });
    }

  } catch (error) {
    console.error("🚨 查单过程中发生致命异常:", error);
    return NextResponse.json({ success: false, message: '服务器内部通信异常' }, { status: 500 });
  }
}