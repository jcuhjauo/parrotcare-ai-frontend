import "./globals.css";
import { Noto_Sans_TC, Noto_Serif_TC } from 'next/font/google';

const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-noto-sans-tc',
});

const notoSerifTC = Noto_Serif_TC({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-noto-serif-tc',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={`${notoSansTC.variable} ${notoSerifTC.variable}`}>
      <body>{children}</body>
    </html>
  );
}