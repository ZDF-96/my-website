import { NextResponse } from 'next/server';

export async function POST(req) {
  // 无条件回复爱发电：成功！
  return NextResponse.json({ ec: 200, em: 'ok' });
}