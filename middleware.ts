import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sitePassword = process.env.SITE_PASSWORD;

  // 沒設定密碼的話就不擋(例如本機開發時)
  if (!sitePassword) return NextResponse.next();

  const isAuthed = request.cookies.get('site-auth')?.value === sitePassword;
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isLoginApi = request.nextUrl.pathname === '/api/site-login';

  if (isAuthed || isLoginPage || isLoginApi) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\.svg).*)'],
};