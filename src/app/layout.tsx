import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

const sans = localFont({
  src: [
    {
      path: "../../font/TmoneyRoundWind/02_수동설치파일/02_ttf/TmoneyRoundWindRegular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../font/TmoneyRoundWind/02_수동설치파일/02_ttf/TmoneyRoundWindRegular.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../font/TmoneyRoundWind/02_수동설치파일/02_ttf/TmoneyRoundWindExtraBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../font/TmoneyRoundWind/02_수동설치파일/02_ttf/TmoneyRoundWindExtraBold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../font/TmoneyRoundWind/02_수동설치파일/02_ttf/TmoneyRoundWindExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Coffee 2048",
  description: "2048 퍼즐과 커피숍 성장을 잇는 힐링 게임",
};

export const viewport: Viewport = {
  themeColor: "#fdf6e9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={sans.variable} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
