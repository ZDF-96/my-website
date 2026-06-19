 import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = Redis.fromEnv();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ paid: false, error: 'Missing orderId' }, { status: 400 });
    }

    // 核心查库：去 Redis 里抓取该订单号的值
    const status = await redis.get(`order:${orderId}`);
    
    // 如果值等于 'success'，说明爱发电的 Webhook 已经通知过我们了
    if (status === 'success') {
      console.log(`🔍 查账链路：发现订单 ${orderId} 已成功支付，通知前端放行！`);
      return NextResponse.json({ paid: true });
    }

    // 如果没查到，说明用户还在扫码或者付款中，返回 false 继续让前台转圈等待
    return NextResponse.json({ paid: false });
  } catch (error) {
    console.error("❌ 前台对账查询接口异常:", error);
    return NextResponse.json({ paid: false, error: 'Database query failed' }, { status: 500 });
  }
}