  import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 🚨 核心修复：函数名必须叫 middleware，Next.js 引擎才会执行它！
export function middleware(req: NextRequest) {
  // 安全读取 Cookie
  const authCookie = req.cookies.get('physics_auth');
  const hasValidTicket = authCookie?.value === 'granted';
  
  const url = req.nextUrl.clone();
  const isLoginPage = url.pathname.startsWith('/login');

  // 1. 如果没有有效通行证，且不在登录页，立刻踢回登录页
  if (!hasValidTicket && !isLoginPage) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 2. 如果已经有通行证了，还不小心访问了 /login 页面，直接护送进主站
  if (hasValidTicket && isLoginPage) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 3. 其他情况，正常放行进入物理宇宙
  return NextResponse.next();
}

// 🎯 优化：组合非捕获正则，大幅提升匹配性能和可读性
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon\\.ico|avatar\\.jpg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)',
  ],
};