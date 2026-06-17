import { NextResponse } from 'next/server';

export function proxy(req) {
  // 获取浏览器中的通行证（Cookie）
  const authCookie = req.cookies.get('physics_auth');
  const url = req.nextUrl.clone();

  // 1. 如果访客已经在一个叫做 /login 的页面，直接放行，防止死循环重定向
  if (url.pathname.startsWith('/login')) {
    return NextResponse.next();
  }

  // 2. 如果没有通行证，或者通行证不对，立刻将他们传送到自定义的登录页
  if (!authCookie || authCookie.value !== 'granted') {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 3. 通行证正确，放行进入物理宇宙
  return NextResponse.next();
}

// 设定拦截范围（和之前一样，避开静态资源）
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$).*)'],
};