import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = Redis.fromEnv();

export async function POST(req) {
  try {
    const body = await req.json();
    
    // 爱发电的回调：out_trade_no 就是我们传过去的 orderId
    if (body.data && body.data.order) {
      const orderId = body.data.order.out_trade_no;
      if (orderId) {
        await redis.set(`order:${orderId}`, 'success', { ex: 86400 });
        console.log(`✅ 订单 ${orderId} 支付成功！`);
      }
    }

    return NextResponse.json({ ec: 200, em: 'ok' });
  } catch (error) {
    console.error("Webhook处理失败:", error);
    return NextResponse.json({ ec: 500, em: 'error' });
  }
}