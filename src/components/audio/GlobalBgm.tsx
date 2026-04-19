"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";
import { publicAssetPath } from "@/lib/publicAssetPath";

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

const BGM_TRACKS = ["/bgm/lobby.mp3", "/bgm/puzzle-2048.mp3"] as const;

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
  if (pathname.startsWith("/puzzle")) {
    return "/bgm/puzzle-2048.mp3";
  }
  return null;
}

export function GlobalBgm() {
  const pathname = usePathname();
  const soundOn = useAppStore((s) => s.settings.soundOn);
  const reducedMotion = useAppStore((s) => s.settings.reducedMotion);

  const track = useMemo(() => pickBgmTrack(pathname ?? "/"), [pathname]);
  const targetVolume = reducedMotion ? 0.22 : 0.28;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const srcRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gestureHandlerRef = useRef<(() => void) | null>(null);
  const retryTimersRef = useRef<number[]>([]);
  const preloadAudioRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    if (typeof window === "undefined" || !soundOn) return;

    for (const bgmTrack of BGM_TRACKS) {
      const src = publicAssetPath(bgmTrack);
      if (!document.querySelector(`link[data-bgm-preload="${bgmTrack}"]`)) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "audio";
        link.href = src;
        link.setAttribute("data-bgm-preload", bgmTrack);
        document.head.appendChild(link);
      }

      if (!preloadAudioRef.current.has(bgmTrack)) {
        const a = new Audio(src);
        a.preload = "auto";
        a.volume = 0;
        preloadAudioRef.current.set(bgmTrack, a);
        try {
          a.load();
        } catch {
          /* noop */
        }
      }
    }
  }, [soundOn]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onReq = (ev: Event) => {
      const audio = audioRef.current;
      const ctx = ctxRef.current;
      const gain = gainRef.current;
      if (!audio || !ctx || !gain) return;
      if (audio.paused) return;

      const detail = (ev as CustomEvent<{ ms?: number }>).detail;
      const ms = Math.max(0, detail?.ms ?? 1200);
      if (ms <= 0) return;

      // Web Audio gain 램프로 확실하게 페이드아웃
      const now = ctx.currentTime;
      const dur = ms / 1000;
      const from = gain.gain.value;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(from, now);
      // 감성: 초반은 조금 더 남기고(이징), 후반에 더 부드럽게 꺼짐
      const mid = now + Math.max(0.02, dur * 0.55);
      const end = now + Math.max(0.04, dur);
      const midVal = from * (1 - easeOutCubic(0.55));
      gain.gain.linearRampToValueAtTime(Math.max(0.0001, midVal), mid);
      gain.gain.linearRampToValueAtTime(0.0001, end);
    };

    window.addEventListener("coffee:request-bgm-fadeout", onReq as EventListener);
    return () => {
      window.removeEventListener(
        "coffee:request-bgm-fadeout",
        onReq as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const FADE_OUT_MS = 1200;
    const SWITCH_FADE_OUT_MS = 950;
    const FADE_IN_MS = 950;

    const detachGestureStart = () => {
      const handler = gestureHandlerRef.current;
      if (!handler) return;
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("touchstart", handler);
      window.removeEventListener("keydown", handler);
      gestureHandlerRef.current = null;
    };

    const clearRetryTimers = () => {
      for (const id of retryTimersRef.current) {
        window.clearTimeout(id);
      }
      retryTimersRef.current = [];
    };

    const ensureAudio = () => {
      if (!audioRef.current) {
        const a = new Audio();
        a.loop = true;
        a.preload = "auto";
        // 볼륨은 Web Audio gain에서 제어
        a.volume = 1;
        audioRef.current = a;
      }
      return audioRef.current;
    };

    const ensureGraph = () => {
      if (!ctxRef.current || ctxRef.current.state === "closed") {
        const Ctx =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!Ctx) return null;
        ctxRef.current = new Ctx();
      }
      const ctx = ctxRef.current;
      if (!ctx) return null;

      if (!gainRef.current) {
        const g = ctx.createGain();
        g.gain.value = 0.0001;
        g.connect(ctx.destination);
        gainRef.current = g;
      }
      const gain = gainRef.current;

      const audio = ensureAudio();
      if (!srcRef.current) {
        // MediaElementSource는 동일 audio element에 대해 1회만 생성 가능
        srcRef.current = ctx.createMediaElementSource(audio);
        srcRef.current.connect(gain);
      }
      return { ctx, gain, audio };
    };

    const resumeCtxIfNeeded = (ctx: AudioContext) => {
      if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    };

    const gainFadeTo = (to: number, ms: number, onDone?: () => void) => {
      const g = gainRef.current;
      const ctx = ctxRef.current;
      if (!g || !ctx) {
        onDone?.();
        return;
      }
      const now = ctx.currentTime;
      const dur = Math.max(0.01, ms / 1000);
      const from = g.gain.value;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(from, now);
      g.gain.linearRampToValueAtTime(Math.max(0.0001, to), now + dur);
      if (onDone) {
        window.setTimeout(onDone, ms + 20);
      }
    };

    const waitUntilPlayable = (audio: HTMLAudioElement, expectedSrc: string) =>
      new Promise<void>((resolve) => {
        if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
          resolve();
          return;
        }

        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          cleanup();
          resolve();
        };
        const cleanup = () => {
          window.clearTimeout(timeoutId);
          audio.removeEventListener("canplay", finish);
          audio.removeEventListener("canplaythrough", finish);
          audio.removeEventListener("loadeddata", finish);
          audio.removeEventListener("error", finish);
        };
        const timeoutId = window.setTimeout(finish, 1800);

        audio.addEventListener("canplay", finish, { once: true });
        audio.addEventListener("canplaythrough", finish, { once: true });
        audio.addEventListener("loadeddata", finish, { once: true });
        audio.addEventListener("error", finish, { once: true });

        if (audio.src !== expectedSrc) {
          finish();
        }
      });

    const stopWithFade = () => {
      detachGestureStart();
      const g = ensureGraph();
      if (!g) return;
      const { audio } = g;
      gainFadeTo(0, FADE_OUT_MS, () => {
        audio.pause();
        audio.currentTime = 0;
      });
    };

    const startOrSwitch = async (nextTrack: string) => {
      const g = ensureGraph();
      if (!g) return;
      const { ctx, audio } = g;
      const nextSrc = publicAssetPath(nextTrack);

      const armGestureResume = () => {
        if (gestureHandlerRef.current) return;
        const onFirstGesture = () => {
          void doPlay();
          detachGestureStart();
        };
        gestureHandlerRef.current = onFirstGesture;
        window.addEventListener("pointerdown", onFirstGesture, { passive: true });
        window.addEventListener("touchstart", onFirstGesture, { passive: true });
        window.addEventListener("keydown", onFirstGesture);
      };

      const doPlay = async () => {
        try {
          // ctx.resume()가 사용자 제스처 없이 실패하면 출력이 0이라 "BGM이 없음"처럼 들림
          if (ctx.state === "suspended") {
            await ctx.resume();
          }
          await waitUntilPlayable(audio, nextSrc);
          await audio.play();
        } catch {
          armGestureResume();
          return;
        }

        // MediaElementSource → destination 경로는 AudioContext가 running일 때만 들립니다.
        // 일부 브라우저에서는 play() Promise가 resolve된 뒤에도 잠깐 suspended인 경우가 있어,
        // 그대로 페이드인만 하면 "클릭음만 나고 BGM은 없음"처럼 보일 수 있습니다.
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
        if (ctx.state !== "running") {
          try {
            audio.pause();
          } catch {
            /* noop */
          }
          armGestureResume();
          return;
        }
        gainFadeTo(targetVolume, FADE_IN_MS);
      };

      // 같은 트랙이면 볼륨만 목표치로 보정
      if (audio.src && audio.src.endsWith(nextTrack)) {
        if (!soundOn) return;
        void doPlay();
        return;
      }

      // 트랙 전환: 기존은 천천히 페이드아웃 후 교체
      if (!audio.paused) {
        gainFadeTo(0, SWITCH_FADE_OUT_MS, () => {
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

    const armRetryStarts = () => {
      clearRetryTimers();
      for (const ms of [120, 380, 900, 1600]) {
        const id = window.setTimeout(() => {
          if (!soundOn || !track) return;
          void startOrSwitch(track);
        }, ms);
        retryTimersRef.current.push(id);
      }
    };

    if (!soundOn || !track) {
      clearRetryTimers();
      stopWithFade();
      return () => {
        detachGestureStart();
        clearRetryTimers();
      };
    }

    void startOrSwitch(track);
    armRetryStarts();

    const onUnlockLike = () => {
      if (!soundOn || !track) return;
      void startOrSwitch(track);
    };
    window.addEventListener("pointerdown", onUnlockLike, { passive: true });
    window.addEventListener("touchstart", onUnlockLike, { passive: true });
    window.addEventListener("keydown", onUnlockLike);
    window.addEventListener("focus", onUnlockLike);
    window.addEventListener("pageshow", onUnlockLike);

    return () => {
      detachGestureStart();
      clearRetryTimers();
      window.removeEventListener("pointerdown", onUnlockLike);
      window.removeEventListener("touchstart", onUnlockLike);
      window.removeEventListener("keydown", onUnlockLike);
      window.removeEventListener("focus", onUnlockLike);
      window.removeEventListener("pageshow", onUnlockLike);
    };
  }, [soundOn, track, targetVolume]);

  // 전역 컴포넌트: UI 없음
  return null;
}
