"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Root layout까지 올라가기 전에 발생한 오류도 html/body를 포함해야 합니다.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  const showDevHint = process.env.NODE_ENV !== "production";

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-5 bg-cream-100 px-6 pb-16 pt-10 text-center text-coffee-900">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-coffee-600/60">
            Coffee 2048
          </p>
          <p className="text-sm leading-relaxed text-coffee-800">
            화면을 불러오지 못했어요. 다시 시도하거나 탭을 새로고침해 주세요.
          </p>
          {error.digest ? (
            <p className="text-[10px] tabular-nums text-coffee-600/50">
              ref: {error.digest}
            </p>
          ) : null}
          {showDevHint && error.message ? (
            <p className="w-full max-w-[20rem] break-words text-[10px] leading-snug text-coffee-600/55">
              {error.message}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-2xl bg-cream-200 px-5 py-2.5 text-sm font-semibold text-coffee-900 ring-1 ring-coffee-600/15 hover:bg-cream-300"
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
