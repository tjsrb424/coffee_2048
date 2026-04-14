/**
 * 짧은 프로시저럴 톤. 에셋 없이 Web Audio로 최소 피드백.
 * 브라우저 자동재생 정책으로 첫 입력 전에는 소리가 안 날 수 있음.
 */
let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedCtx || sharedCtx.state === "closed") {
    sharedCtx = new Ctx();
  }
  return sharedCtx;
}

function resumeIfNeeded(ctx: AudioContext) {
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
}

export function playMergePlink(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  resumeIfNeeded(ctx);
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(392, t0);
  osc.frequency.exponentialRampToValueAtTime(523.25, t0 + 0.06);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.07, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.11);
}

export function playMoveTick(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  resumeIfNeeded(ctx);
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(180, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.035, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.07);
}
