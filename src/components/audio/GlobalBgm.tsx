"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";
import { publicAssetPath } from "@/lib/publicAssetPath";

type FadeJob = { raf: number; token: number };

function pickBgmTrack(pathname: string): string | null {
  // 주요 허브 화면에서는 같은 BGM을 유지.
  if (
    pathname === "/" ||
    pathname.startsWith("/lobby") ||
    pathname.startsWith("/cafe") ||
    pathname.startsWith("/extension") ||
    pathname.startsWith("/settings")
  ) {
    return "/bgm/lobby.mp3";
  }
  return null;
}

export function GlobalBgm() {
  const pathname = usePathname();
  const soundOn = useAppStore((s) => s.settings.soundOn);
  const reducedMotion = useAppStore((s) => s.settings.reducedMotion);

  const track = useMemo(() => pickBgmTrack(pathname), [pathname]);
  const targetVolume = reducedMotion ? 0.22 : 0.28;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<FadeJob>({ raf: 0, token: 0 });
  const gestureHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const cancelFade = () => {
      const job = fadeRef.current;
      if (job.raf) cancelAnimationFrame(job.raf);
      job.raf = 0;
      job.token += 1;
    };

    const fadeTo = (to: number, ms: number, onDone?: () => void) => {
      const audio = audioRef.current;
      if (!audio) {
        onDone?.();
        return;
      }
      cancelFade();
      const jobToken = fadeRef.current.token;
      const from = audio.volume;
      const startAt = performance.now();
      const step = (now: number) => {
        if (fadeRef.current.token !== jobToken) return;
        const t = Math.min(1, (now - startAt) / ms);
        audio.volume = from + (to - from) * t;
        if (t < 1) {
          fadeRef.current.raf = requestAnimationFrame(step);
        } else {
          fadeRef.current.raf = 0;
          onDone?.();
        }
      };
      fadeRef.current.raf = requestAnimationFrame(step);
    };

    const detachGestureStart = () => {
      const handler = gestureHandlerRef.current;
      if (!handler) return;
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("touchstart", handler);
      gestureHandlerRef.current = null;
    };

    const ensureAudio = () => {
      if (!audioRef.current) {
        const a = new Audio();
        a.loop = true;
        a.preload = "auto";
        a.volume = 0;
        audioRef.current = a;
      }
      return audioRef.current;
    };

    const stopWithFade = () => {
      detachGestureStart();
      const audio = audioRef.current;
      if (!audio) return;
      fadeTo(0, 700, () => {
        audio.pause();
        audio.currentTime = 0;
      });
    };

    const startOrSwitch = async (nextTrack: string) => {
      const audio = ensureAudio();
      const nextSrc = publicAssetPath(nextTrack);

      const doPlay = async () => {
        try {
          await audio.play();
          fadeTo(targetVolume, 900);
        } catch {
          // 사용자 제스처 전 재생 실패 대비
          if (gestureHandlerRef.current) return;
          const onFirstGesture = () => {
            void doPlay();
            detachGestureStart();
          };
          gestureHandlerRef.current = onFirstGesture;
          window.addEventListener("pointerdown", onFirstGesture, { passive: true });
          window.addEventListener("touchstart", onFirstGesture, { passive: true });
        }
      };

      // 같은 트랙이면 볼륨만 목표치로 보정
      if (audio.src && audio.src.endsWith(nextTrack)) {
        if (!soundOn) return;
        void doPlay();
        return;
      }

      // 트랙 전환: 기존은 천천히 페이드아웃 후 교체
      if (!audio.paused && audio.volume > 0.001) {
        fadeTo(0, 700, () => {
          audio.pause();
          audio.currentTime = 0;
          audio.src = nextSrc;
          audio.load();
          if (soundOn) void doPlay();
        });
      } else {
        audio.src = nextSrc;
        audio.load();
        if (soundOn) void doPlay();
      }
    };

    if (!soundOn || !track) {
      stopWithFade();
      return () => {
        detachGestureStart();
        cancelFade();
      };
    }

    void startOrSwitch(track);

    return () => {
      detachGestureStart();
      cancelFade();
    };
  }, [soundOn, track, targetVolume]);

  // 전역 컴포넌트: UI 없음
  return null;
}

