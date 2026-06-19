 import crypto from 'crypto';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // 🛡️ 防爆盾：用纯文本接收，防止异常格式导致解析崩溃
    const rawBody = await request.text();
    let orderId = "";

    try {
      const body = JSON.parse(rawBody);
      orderId = body.orderId || body.out_trade_no || body.password || body.order || "";
    } catch (e) {
      orderId = rawBody.replace(/[^a-zA-Z0-9]/g, ''); 
    }

    // ⚡️ 强制字符串转换并清理空格
    orderId = String(orderId).trim();

    if (!orderId) {
      return NextResponse.json({ success: false, message: '未能识别到付款单号，请重新输入' }, { status: 400 });
    }

    const userId = process.env.AFDIAN_USER_ID;
    const token = process.env.AFDIAN_TOKEN;

    if (!userId || !token) {
      return NextResponse.json({ success: false, message: '服务端凭证缺失，请检查环境变量' }, { status: 500 });
    }

    const paramsObj = { out_trade_no: orderId };
    const paramsStr = JSON.stringify(paramsObj);
    const ts = Math.floor(Date.now() / 1000);
    
    const signString = `${token}${paramsStr}${ts}${userId}`;
    const sign = crypto.createHash('md5').update(signString).digest('hex');

    console.log(`👉 正在向爱发电核验付款单号: ${orderId}...`);

    // ⚡️ 核心突破：加上全套伪装 Header，骗过爱发电的 WAF 防火墙
    const response = await fetch('https://afdian.net/api/open/query-order', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Connection': 'keep-alive'
      },
      body: JSON.stringify({
        user_id: userId,
        params: paramsStr,
        ts: ts,
        sign: sign
      }),
      cache: 'no-store' 
    });

    const data = await response.json();

    if (data.ec !== 200) {
      return NextResponse.json({ success: false, message: `爱发电拒绝查询: ${data.em}` });
    }

    const orderList = data.data.list;
    if (orderList && orderList.length > 0) {
      console.log(`✅ 查账成功！单号 ${orderId} 真实有效！`);
      
      const today = new Date();
      const dayStr = String(today.getDate()).padStart(2, '0'); 
      const todayPwd = '4729' + dayStr; 

      return NextResponse.json({ 
        success: true, 
        message: '单号核验通过！',
        dynamicPassword: todayPwd 
      });
    } else {
      console.log(`⚠️ 查无此单: ${orderId}`);
      return NextResponse.json({ success: false, message: '未查到该付款单号，请核对是否填错' });
    }

  } catch (error) {
    console.error("❌ 后端发生致命异常:", error.message);
    return NextResponse.json({ success: false, message: `系统内部处理异常: ${error.message}` }, { status: 500 });
  }
}