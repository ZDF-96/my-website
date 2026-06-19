 import crypto from 'crypto';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const rawBody = await request.text();
    let orderId = "";

    try {
      const body = JSON.parse(rawBody);
      orderId = body.orderId || body.out_trade_no || body.password || body.order || "";
    } catch (e) {
      orderId = rawBody.replace(/[^a-zA-Z0-9]/g, ''); 
    }

    // ⚡️ 修复点：强制把单号转换成字符串，防止超长数字引发 .trim() 崩溃
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

    const response = await fetch('https://afdian.net/api/open/query-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    // ⚡️ 把具体的报错信息直接打在终端和网页上，再也不用猜了
    console.error("❌ 后端发生致命异常:", error.message);
    return NextResponse.json({ success: false, message: `系统内部处理异常: ${error.message}` }, { status: 500 });
  }
}