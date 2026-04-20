/**
 * 짧은 프로시저럴 톤. 에셋 없이 Web Audio로 최소 피드백.
 * 브라우저 자동재생 정책으로 첫 입력 전에는 소리가 안 날 수 있음.
 */
let sharedCtx: AudioContext | null = null;
let sharedMaster:
  | {
      ctx: AudioContext;
      input: GainNode;
    }
  | null = null;

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

function getMasterInput(ctx: AudioContext): GainNode {
  if (sharedMaster?.ctx === ctx) return sharedMaster.input;

  const input = ctx.createGain();
  input.gain.value = 0.84;

  // 여러 소리가 한 번에 나도 “증폭”처럼 안 들리도록
  // 가벼운 컴프레서로 피크를 눌러준다.
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.setValueAtTime(-22, ctx.currentTime);
  comp.knee.setValueAtTime(18, ctx.currentTime);
  comp.ratio.setValueAtTime(6, ctx.currentTime);
  comp.attack.setValueAtTime(0.003, ctx.currentTime);
  comp.release.setValueAtTime(0.22, ctx.currentTime);

  input.connect(comp);
  comp.connect(ctx.destination);

  sharedMaster = { ctx, input };
  return input;
}

export function warmWebAudioPlinks(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  getMasterInput(ctx);
}

export function unlockWebAudioPlinks(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  getMasterInput(ctx);
  resumeIfNeeded(ctx);
}

export function playMergePlink(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  resumeIfNeeded(ctx);
  const master = getMasterInput(ctx);
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(392, t0);
  osc.frequency.exponentialRampToValueAtTime(523.25, t0 + 0.06);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.084, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + 0.11);
}

export function playMoveTick(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  resumeIfNeeded(ctx);
  const master = getMasterInput(ctx);
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(180, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.031, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + 0.07);
}
