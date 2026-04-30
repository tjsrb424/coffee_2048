import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

const gangwonEduAll = localFont({
  src: [
    {
      path: "../../font/GangwonEduAll/GangwonEduAll-Web-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../font/GangwonEduAll/GangwonEduAll-Web-Light.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../font/GangwonEduAll/GangwonEduAll-Web-Light.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../font/GangwonEduAll/GangwonEduAll-Web-Bold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../font/GangwonEduAll/GangwonEduAll-Web-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../font/GangwonEduAll/GangwonEduAll-Web-Bold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../font/GangwonEduAll/GangwonEduAll-Web-Bold.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-gangwon-edu-all",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Coffee 2048",
  description: "2048 퍼즐과 커피숍 성장이 만나는 힐링 게임",
};

export const viewport: Viewport = {
  themeColor: "#fdf6e9",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={gangwonEduAll.variable} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
