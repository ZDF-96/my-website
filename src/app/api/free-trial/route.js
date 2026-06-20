import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// 自动连接 Upstash 数据库（需要环境变量支持）
const redis = Redis.fromEnv();

export async function POST(request) {
  try {
    // 1. 从 Vercel 服务器头部硬核抓取访客的真实物理 IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown-ip';

    // 防止本地开发时抓不到 IP 报错
    if (realIp === 'unknown-ip') {
        console.log("未检测到有效 IP，可能是本地环境");
    }

    // 定义这个 IP 在数据库里的专属名字
    const ipKey = `free_trial_${realIp}`;

    // 2. 去 Upstash 数据库查底：这个 IP 领过免费额度吗？
    const hasUsed = await redis.get(ipKey);

    // 🚨 如果查到了（不是 null），说明白嫖过了，直接击毙！
    if (hasUsed) {
      console.log(`拦截重复白嫖 IP: ${realIp}`);
      return NextResponse.json({ success: false, message: '该物理节点已耗尽配额' });
    }

    // 3. 如果没用过，把这个 IP 永久刻在数据库里！
    // (如果你想让用户半年后能再领一次，可以加上 { ex: 15552000 })
    await redis.set(ipKey, 'true');
    console.log(`新客 IP 绑定成功: ${realIp}`);

    // 放行！给前端发成功信号
    return NextResponse.json({ success: true, message: '验证通过' });

  } catch (error) {
    console.error("Redis 数据库异常或环境变量未配置:", error);
    return NextResponse.json({ success: false, message: '服务器异常' }, { status: 500 });
  }
}