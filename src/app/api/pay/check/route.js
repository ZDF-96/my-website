import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = Redis.fromEnv();

export async function GET(req) {
  // 获取 URL 参数
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ paid: false });
  }

  try {
    const status = await redis.get(`order:${orderId}`);
    if (status === 'success') {
      return NextResponse.json({ paid: true });
    }
    return NextResponse.json({ paid: false });
  } catch (error) {
    return NextResponse.json({ paid: false }, { status: 500 });
  }
}