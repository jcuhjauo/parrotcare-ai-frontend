import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { password } = await request.json();
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword || password !== sitePassword) {
    return NextResponse.json({ message: '密碼錯誤' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('site-auth', sitePassword, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 天
    path: '/',
  });
  return res;
}