import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// 自动连接 Upstash 数据库（需要环境变量支持）
const redis = Redis.fromEnv();

export async function POST(request) {
  try {
    // 1. 优先使用 Next.js/Vercel 自带的原生 IP 属性，如果没有再降级抓取请求头
    const ip = request.ip || 
               request.headers.get('x-real-ip') || 
               request.headers.get('x-forwarded-for')?.split(',')[0].trim();

    // 🚨 防御：如果用尽所有方法都没抓到 IP（异常或非法请求），直接拒绝，避免污染数据库
    if (!ip) {
      console.log("未检测到有效 IP，拒绝发放免费额度");
      return NextResponse.json({ success: false, message: '网络环境异常，无法验证设备' }, { status: 400 });
    }

    // 定义这个 IP 在数据库里的专属名字
    const ipKey = `free_trial_${ip}`;

    // 2. 去 Upstash 数据库查底：这个 IP 领过免费额度吗？
    const hasUsed = await redis.get(ipKey);

    // 如果查到了（不是 null），说明白嫖过了，直接拦截！
    if (hasUsed) {
      console.log(`拦截重复白嫖 IP: ${ip}`);
      return NextResponse.json({ success: false, message: '该物理节点已耗尽配额' });
    }

    // 3. 如果没用过，把这个 IP 刻在数据库里，并设置 365 天后过期自动销毁（保护数据库容量）
    // 86400秒 * 365天 = 31536000
    await redis.set(ipKey, 'true', { ex: 31536000 });
    console.log(`新客 IP 绑定成功: ${ip}`);

    // 放行！给前端发成功信号
    return NextResponse.json({ success: true, message: '验证通过' });

  } catch (error) {
    console.error("Redis 数据库异常或环境变量未配置:", error);
    return NextResponse.json({ success: false, message: '服务器开小差了，请稍后再试' }, { status: 500 });
  }
}