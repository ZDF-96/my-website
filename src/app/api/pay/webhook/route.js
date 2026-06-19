 import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = Redis.fromEnv();

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("收到爱发电 Webhook 真实动态回调:", JSON.stringify(body));
    
    // 拦截爱发电发送的订单数据
    if (body && body.data && body.data.order) {
      const orderId = body.data.order.out_trade_no; // 我们在前端生成的 PHY_ 开头的唯一订单号
      
      if (orderId) {
        // 核心入库：将订单状态标记为 success，并设置 86400 秒 (24小时) 后自动从数据库销毁
        await redis.set(`order:${orderId}`, 'success', { ex: 86400 });
        console.log(`✅ 核心对账成功：订单 ${orderId} 支付信号已安全写入 Redis 数据库！`);
        
        // 必须按爱发电官方规范，精确返回 ec 200
        return NextResponse.json({ ec: 200, em: 'ok' });
      }
    }

    return NextResponse.json({ ec: 400, em: 'bad request' });
  } catch (error) {
    console.error("❌ Webhook 核心逻辑处理失败:", error);
    return NextResponse.json({ ec: 500, em: 'internal error' });
  }
}