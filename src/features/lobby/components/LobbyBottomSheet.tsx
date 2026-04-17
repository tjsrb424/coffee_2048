"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { t } from "@/locale/i18n";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  floatingNotice?: ReactNode;
  floatingNoticeClassName?: string;
  /** 감성 한 줄 */
  tagline?: string;
  /** 상태 요약(숫자 한 줄) */
  summary?: string;
  /** 시트 내부 상단 설명(선택) */
  description?: string;
  /**
   * 시트 상단 가운데에 겹치는 장식(예: 로스터 PNG).
   * 시트 윗변을 기준으로 세로 중앙이 경계에 오도록(반은 밖, 반은 안) 배치된다.
   */
  topOverlap?: ReactNode;
  /** 헤더 텍스트 정렬(특정 시트에서만 사용) */
  headerAlign?: "default" | "center";
  /** 헤더 제목 사이즈(특정 시트에서만 사용) */
  titleSize?: "default" | "lg" | "xl";
  /**
   * 상단 겹침 이미지가 있을 때 헤더 상단 패딩.
   * 기본은 일러스트 높이의 절반에 맞춤. 시트별로 더 촘촘히 줄일 때 오버라이드.
   */
  topOverlapHeaderPaddingClassName?: string;
};

export function LobbyBottomSheet({
  open,
  title,
  onClose,
  children,
  floatingNotice,
  floatingNoticeClassName,
  tagline,
  summary,
  description,
  topOverlap,
  headerAlign = "default",
  titleSize = "default",
  topOverlapHeaderPaddingClassName,
}: Props) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal>
          <motion.button
            type="button"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0 }}
            transition={reduce ? { duration: 0.12 } : { duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0 z-0 bg-coffee-900/35 backdrop-blur-[2px]"
            aria-label={t("a11y.closeSheet")}
            onClick={onClose}
          />
          <motion.div
            initial={
              reduce
                ? false
                : { opacity: 0, y: 16, scale: 0.992 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, y: 10, scale: 0.996 }
            }
            transition={
              reduce
                ? { duration: 0.14 }
                : {
                    opacity: { duration: 0.2, ease: "easeOut" },
                    y: { type: "spring", stiffness: 420, damping: 34, mass: 0.82 },
                    scale: { type: "spring", stiffness: 460, damping: 36, mass: 0.82 },
                  }
            }
            style={{
              marginBottom: "max(0.5rem, env(safe-area-inset-bottom))",
              maxHeight: "min(90vh, 42rem)",
            }}
            className={cn(
              "relative z-10 mx-auto flex min-h-0 w-full max-w-md flex-col overflow-visible rounded-3xl border border-white/40 will-change-transform",
              "bg-cream-50/95 shadow-lift ring-1 ring-coffee-600/10 backdrop-blur-md",
            )}
          >
            {floatingNotice ? (
              <div
                className={cn(
                  "pointer-events-none absolute left-1/2 top-0 z-40 w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 -translate-y-[calc(100%+0.75rem)]",
                  floatingNoticeClassName,
                )}
              >
                {floatingNotice}
              </div>
            ) : null}
            {topOverlap ? (
              <div
                className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2"
                aria-hidden
              >
                {topOverlap}
              </div>
            ) : null}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl">
              <div
                className={cn(
                  "relative shrink-0 border-b border-coffee-600/10 px-4 py-3",
                  topOverlap && "z-30",
                  topOverlap &&
                    (topOverlapHeaderPaddingClassName ??
                      "pt-[11.5rem] sm:pt-48"),
                )}
              >
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-3 top-3 z-30 rounded-xl px-3 py-1.5 text-sm font-semibold text-coffee-600/80 hover:bg-cream-200/80 hover:text-coffee-900"
                >
                  닫기
                </button>
                <div
                  className={cn(
                    "min-w-0",
                    headerAlign === "center" && "text-center",
                  )}
                >
                  <h2
                    className={cn(
                      "font-bold text-coffee-900",
                      titleSize === "xl"
                        ? "text-[1.46rem] leading-snug sm:text-[1.5rem]"
                        : titleSize === "lg"
                          ? "text-lg"
                          : "text-base",
                    )}
                  >
                    {title}
                  </h2>
                  {tagline ? (
                    <p className="mt-0.5 text-[11px] font-medium tracking-wide text-accent-soft/95">
                      {tagline}
                    </p>
                  ) : null}
                  {summary ? (
                    <p className="mt-1 text-sm font-semibold tabular-nums text-coffee-800">
                      {summary}
                    </p>
                  ) : null}
                  {description ? (
                    <p className="mt-1 text-xs leading-relaxed text-coffee-600/75">
                      {description}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                {children}
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
