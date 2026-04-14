let sharedClick: HTMLAudioElement | null = null;

function getClick(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!sharedClick) {
    const a = new Audio("/sfx/click.mp3");
    a.preload = "auto";
    a.volume = 0.85;
    sharedClick = a;
  }
  return sharedClick;
}

export function playUiClick(): void {
  const a = getClick();
  if (!a) return;
  try {
    // 짧은 클릭은 겹치지 않게 즉시 재시작
    a.currentTime = 0;
    void a.play();
  } catch {
    // autoplay 정책/기타 에러는 무시
  }
}

