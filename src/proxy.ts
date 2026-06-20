 import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 严格使用名为 proxy 的具名导出函数
export function proxy(req: NextRequest) {
  // 获取浏览器中的通行证（Cookie）
  const authCookie = req.cookies.get('physics_auth');
  const url = req.nextUrl.clone();

  const isLoginPage = url.pathname.startsWith('/login');
  const hasValidTicket = authCookie && authCookie.value === 'granted';

  // 1. 如果没有有效通行证，且不在登录页，立刻踢回登录页
  if (!hasValidTicket && !isLoginPage) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 2. 如果已经有通行证了，还不小心访问了 /login 页面，直接护送进主站（免去重复登录）
  if (hasValidTicket && isLoginPage) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 3. 其他情况，正常放行进入物理宇宙
  return NextResponse.next();
}

// 设定拦截范围（避开 API、静态图片、头像以及网页底层文件）
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|avatar\\.jpg|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.html$).*)'],
};