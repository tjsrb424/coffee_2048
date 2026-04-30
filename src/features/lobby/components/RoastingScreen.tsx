"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCafeRuntimeModifiers } from "@/features/meta/balance/cafeModifiers";
import { useResetDocumentScrollOnMount } from "@/hooks/useResetDocumentScrollOnMount";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/useAppStore";

type RoastLevel = "light" | "medium" | "dark";
type RoastingStatus = "idle" | "roasting" | "complete";

type BeanItem = {
  id: string;
  name: string;
  imageSrc?: string;
  rarity: number;
  tags: string[];
  description: string;
};

const ROASTING_ASSETS = {
  reference: "/assets/roasting/reference/roasting_final_reference.png",
  background: "/assets/roasting/ui/background.png",
  backButton: "/assets/roasting/ui/back_button.png",
  currencyHud: "/assets/roasting/ui/currency_hud.png",
  titleSign: "/assets/roasting/ui/title_sign.png",
  machine: "/assets/roasting/machine/roaster_machine.png",
  beanInfoCard: "/assets/roasting/ui/selected_bean_info_card.png",
  beanSelectionPanel: "/assets/roasting/ui/bean_selection_panel.png",
  beanCard: "/assets/roasting/ui/bean_card.png",
  beanCardSelected: "/assets/roasting/ui/bean_card_selected.png",
  checkIcon: "/assets/roasting/ui/check_icon.png",
  roastLevelButtonOn: "/assets/roasting/ui/roast_level_button_on.png",
  roastLevelButtonOff: "/assets/roasting/ui/roast_level_button_off.png",
  startButton: "/assets/roasting/ui/start_button.png",
  progressPanel: "/assets/roasting/ui/progress_panel.png",
  progressTrack: "/assets/roasting/ui/progress_track.png",
  progressFill: "/assets/roasting/ui/progress_fill.png",
  storageButton: "/assets/roasting/ui/storage_button.png",
  completedBeansButton: "/assets/roasting/ui/completed_beans_button.png",
} as const;

const BEANS: BeanItem[] = [
  {
    id: "ethiopia",
    name: "에티오피아 예가체프",
    rarity: 3,
    tags: ["플로럴", "시트러스", "산뜻함"],
    description: "밝은 향과 산뜻한 여운이 살아나는 원두예요.",
  },
  {
    id: "brazil",
    name: "브라질 산토스",
    rarity: 2,
    tags: ["고소함", "초콜릿", "부드러움"],
    description: "고소한 단맛과 안정적인 바디감이 좋은 원두예요.",
  },
  {
    id: "colombia",
    name: "콜롬비아 수프리모",
    rarity: 3,
    tags: ["밸런스", "캐러멜", "깔끔함"],
    description: "단맛과 산미가 균형 있게 어울리는 원두예요.",
  },
];

const ROAST_LEVELS: Array<{
  id: RoastLevel;
  label: string;
  beanTone: string;
  durationSeconds: number;
  description: string;
}> = [
  {
    id: "light",
    label: "연하게",
    beanTone: "#b98558",
    durationSeconds: 10,
    description: "향을 가볍게 살려요",
  },
  {
    id: "medium",
    label: "중간",
    beanTone: "#8a5635",
    durationSeconds: 14,
    description: "균형 있게 구워요",
  },
  {
    id: "dark",
    label: "진하게",
    beanTone: "#4d2f20",
    durationSeconds: 18,
    description: "묵직한 맛을 내요",
  },
];

export function RoastingScreen() {
  useResetDocumentScrollOnMount();

  const [selectedBeanId, setSelectedBeanId] = useState(BEANS[0]!.id);
  const [selectedRoastLevel, setSelectedRoastLevel] =
    useState<RoastLevel>("medium");
  const [status, setStatus] = useState<RoastingStatus>("idle");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const resources = useAppStore((s) => s.playerResources);
  const cafe = useAppStore((s) => s.cafeState);
  const roastOnce = useAppStore((s) => s.roastOnce);

  const runtime = getCafeRuntimeModifiers(cafe);
  const selectedBean = useMemo(
    () => BEANS.find((bean) => bean.id === selectedBeanId) ?? BEANS[0]!,
    [selectedBeanId],
  );
  const selectedLevel = useMemo(
    () =>
      ROAST_LEVELS.find((level) => level.id === selectedRoastLevel) ??
      ROAST_LEVELS[1]!,
    [selectedRoastLevel],
  );

  const finishAt = startedAt
    ? startedAt + selectedLevel.durationSeconds * 1000
    : null;
  const remainingMs =
    status === "roasting" && finishAt ? Math.max(0, finishAt - now) : 0;
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const progressPercent =
    status === "complete"
      ? 100
      : startedAt && finishAt
        ? Math.min(
            100,
            Math.max(0, Math.round(((now - startedAt) / (finishAt - startedAt)) * 100)),
          )
        : 0;
  const canStart =
    status === "idle" &&
    resources.beans >= runtime.roastBeanCost &&
    cafe.espressoShots < runtime.maxShots;

  useEffect(() => {
    if (status !== "roasting") return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status === "roasting" && finishAt && now >= finishAt) {
      setStatus("complete");
    }
  }, [finishAt, now, status]);

  const handleStartButton = () => {
    if (status === "roasting") return;
    if (status === "complete") {
      const didRoast = roastOnce();
      if (didRoast) {
        setStatus("idle");
        setStartedAt(null);
      }
      return;
    }
    if (!canStart) return;
    setStartedAt(Date.now());
    setNow(Date.now());
    setStatus("roasting");
  };

  return (
    <RoastingBackground>
      <RoastingHeader
        coins={resources.coins}
        beans={resources.beans}
        hearts={resources.hearts}
      />

      <main className="relative z-10 mx-auto flex h-[100dvh] w-full max-w-md flex-col px-3 pb-[72px] pt-[70px]">
        <RoastingTitleSign />
        <section className="mt-1 grid grid-cols-[1fr_108px] items-center gap-1.5">
          <RoasterMachineStage
            isRoasting={status === "roasting"}
            progressPercent={progressPercent}
          />
          <SelectedBeanInfoCard bean={selectedBean} />
        </section>

        <BeanSelectionPanel
          beans={BEANS}
          selectedBeanId={selectedBeanId}
          stock={resources.beans}
          onSelect={setSelectedBeanId}
        />

        <RoastLevelSelector
          selected={selectedRoastLevel}
          onSelect={setSelectedRoastLevel}
          disabled={status === "roasting"}
        />

        <RoastingStartButton
          status={status}
          canStart={canStart}
          onClick={handleStartButton}
        />

        <RoastingProgressPanel
          status={status}
          remainingSeconds={remainingSeconds}
          progressPercent={progressPercent}
          roastCost={runtime.roastBeanCost}
          shotYield={runtime.shotYield}
          maxShots={runtime.maxShots}
          currentShots={cafe.espressoShots}
        />
      </main>

      <RoastingBottomActions />
    </RoastingBackground>
  );
}

function RoastingBackground({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="roasting-background h-[100dvh] overflow-hidden text-[#4f3322]"
      style={{
        background:
          "linear-gradient(180deg, #bfe3ee 0%, #d8edf1 28%, #f6dfb7 72%, #dfb981 100%)",
      }}
      data-asset-path={ROASTING_ASSETS.background}
    >
      {children}
    </div>
  );
}

function RoastingHeader({
  coins,
  beans,
  hearts,
}: {
  coins: number;
  beans: number;
  hearts: number;
}) {
  return (
    <header className="roasting-header fixed inset-x-0 top-0 z-30 mx-auto flex h-[60px] max-w-md items-start justify-between px-3 pt-[calc(env(safe-area-inset-top)+8px)]">
      <RoastingBackButton />
      <RoastingCurrencyHud coins={coins} beans={beans} hearts={hearts} />
    </header>
  );
}

function RoastingBackButton() {
  return (
    <Link
      href="/lobby"
      aria-label="로비로 돌아가기"
      className="roasting-back-button flex h-10 w-10 items-center justify-center rounded-full border border-[#7a593b]/22 bg-[#fff5db]/88 text-2xl font-black text-[#5a3a25] backdrop-blur-sm active:scale-95"
      style={{ boxShadow: "0 8px 18px rgba(70, 46, 25, 0.18)" }}
      data-asset-path={ROASTING_ASSETS.backButton}
    >
      ‹
    </Link>
  );
}

function RoastingCurrencyHud({
  coins,
  beans,
  hearts,
}: {
  coins: number;
  beans: number;
  hearts: number;
}) {
  return (
    <div
      className="roasting-currency-hud mr-12 flex h-10 items-center gap-1.5 rounded-full border border-[#7a593b]/16 bg-white/62 px-2.5 py-1.5 backdrop-blur-md"
      style={{ boxShadow: "0 10px 22px rgba(80, 54, 30, 0.16)" }}
      data-asset-path={ROASTING_ASSETS.currencyHud}
    >
      <CurrencyItem iconSrc="/images/optimized/ui/coin.webp" value={coins} label="코인" />
      <CurrencyItem iconSrc="/images/optimized/ui/bean.webp" value={beans} label="원두" />
      <CurrencyItem iconSrc="/images/optimized/ui/heart.webp" value={hearts} label="하트" />
    </div>
  );
}

function CurrencyItem({
  iconSrc,
  value,
  label,
}: {
  iconSrc: string;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1" aria-label={`${label} ${value}`}>
      <Image
        src={iconSrc}
        alt=""
        width={18}
        height={18}
        className="h-4 w-4 object-contain"
      />
      <span className="text-[11px] font-black tabular-nums text-[#5d3c27]">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

function RoastingTitleSign() {
  return (
    <section
      className="roasting-title-sign relative mx-auto flex h-12 w-[164px] items-center justify-center rounded-[22px] border border-[#8b5d3b]/24 bg-[#fff0c8]/94 text-center"
      style={{ boxShadow: "0 10px 20px rgba(85, 56, 31, 0.14)" }}
      data-asset-path={ROASTING_ASSETS.titleSign}
    >
      <span className="absolute -top-5 left-8 h-6 w-1 rounded-full bg-[#92653f]/42" />
      <span className="absolute -top-5 right-8 h-6 w-1 rounded-full bg-[#92653f]/42" />
      <h1 className="text-[24px] font-black leading-none text-[#5a3823]">
        로스팅
      </h1>
    </section>
  );
}

function RoasterMachineStage({
  isRoasting,
  progressPercent,
}: {
  isRoasting: boolean;
  progressPercent: number;
}) {
  return (
    <section
      className={cn(
        "roaster-machine-stage relative flex h-[178px] items-center justify-center",
        isRoasting && "animate-pulse",
      )}
      data-asset-path={ROASTING_ASSETS.machine}
    >
      {isRoasting ? (
        <>
          <span className="absolute left-16 top-4 h-10 w-2 rounded-full bg-white/38 blur-sm" />
          <span className="absolute right-16 top-5 h-8 w-2 rounded-full bg-white/32 blur-sm" />
        </>
      ) : null}
      <div className="relative flex h-[172px] w-[178px] flex-col items-center">
        <Image
          src="/images/optimized/ui/roaster-machine-2.webp"
          alt="로스터 머신"
          width={180}
          height={180}
          priority
          className="h-[138px] w-[138px] object-contain"
        />
        <div className="absolute bottom-4 h-11 w-32 rounded-[50%] border border-[#7b4d2f]/24 bg-[#845734]/88">
          <div className="mx-auto mt-1.5 h-6 w-20 rounded-[50%] bg-[#4d2f20]/82" />
        </div>
        <div className="absolute bottom-1 h-2.5 w-28 overflow-hidden rounded-full bg-[#d3b285]">
          <div
            className="h-full rounded-full bg-[#75b5d0]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </section>
  );
}

function SelectedBeanInfoCard({ bean }: { bean: BeanItem }) {
  return (
    <aside
      className="selected-bean-info-card rounded-[20px] border border-[#b98558]/30 bg-[#fff8e7]/88 p-2"
      style={{ boxShadow: "0 8px 16px rgba(83, 54, 31, 0.1)" }}
      data-asset-path={ROASTING_ASSETS.beanInfoCard}
    >
      <p className="text-[10px] font-black text-[#7b5738]/70">선택 원두</p>
      <div className="mt-1 flex h-12 items-center justify-center rounded-[16px] bg-[#f1d3a5]/68">
        <BeanVisual bean={bean} size="large" />
      </div>
      <h2 className="mt-1 line-clamp-2 text-[12px] font-black leading-tight text-[#513522]">
        {bean.name}
      </h2>
      <div className="mt-1 flex flex-wrap gap-1">
        {bean.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-[#c6e0e8] px-1.5 py-0.5 text-[9px] font-black text-[#315a6c]"
          >
            {tag}
          </span>
        ))}
      </div>
    </aside>
  );
}

function BeanSelectionPanel({
  beans,
  selectedBeanId,
  stock,
  onSelect,
}: {
  beans: BeanItem[];
  selectedBeanId: string;
  stock: number;
  onSelect: (id: string) => void;
}) {
  return (
    <section
      className="bean-selection-panel mt-1.5 rounded-[22px] border border-[#bd8b5d]/32 bg-[#fff6df]/88 p-2.5"
      style={{ boxShadow: "0 8px 18px rgba(80, 51, 27, 0.1)" }}
      data-asset-path={ROASTING_ASSETS.beanSelectionPanel}
    >
      <div className="mb-1.5 flex items-end justify-between">
        <h2 className="text-sm font-black text-[#533621]">원두 선택</h2>
        <p className="text-[11px] font-bold text-[#735236]/72">
          보유 원두 {stock}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {beans.map((bean) => (
          <BeanCard
            key={bean.id}
            bean={bean}
            selected={bean.id === selectedBeanId}
            disabled={stock <= 0}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}

function BeanCard({
  bean,
  selected,
  disabled,
  onSelect,
}: {
  bean: BeanItem;
  selected: boolean;
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(bean.id)}
      disabled={disabled}
      className={cn(
        "bean-card relative min-h-[86px] rounded-[18px] border p-1.5 text-center transition-transform active:scale-[0.98] disabled:opacity-55",
        selected
          ? "border-[#5b9fbe] bg-[#f4fbff] ring-2 ring-[#8cc6dc]"
          : "border-[#d0a978]/48 bg-[#fffaf0]",
      )}
      data-asset-path={
        selected ? ROASTING_ASSETS.beanCardSelected : ROASTING_ASSETS.beanCard
      }
    >
      {selected ? (
        <span
          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#79b8d1] text-xs font-black text-white"
          data-asset-path={ROASTING_ASSETS.checkIcon}
        >
          ✓
        </span>
      ) : null}
      <div className="mx-auto mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#efd2a7]">
        <BeanVisual bean={bean} size="small" />
      </div>
      <p className="mt-1 line-clamp-2 text-[10px] font-black leading-tight text-[#563823]">
        {bean.name.replace(" ", "\n")}
      </p>
      <p className="mt-0.5 text-[9px] font-black tracking-[0.08em] text-[#c38b36]">
        {"★".repeat(bean.rarity)}
      </p>
    </button>
  );
}

function RoastLevelSelector({
  selected,
  onSelect,
  disabled,
}: {
  selected: RoastLevel;
  onSelect: (level: RoastLevel) => void;
  disabled: boolean;
}) {
  return (
    <section className="roast-level-selector mt-1.5 rounded-[22px] border border-[#bd8b5d]/28 bg-[#fff8e7]/84 p-2.5">
      <h2 className="text-sm font-black text-[#533621]">로스팅 단계</h2>
      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
        {ROAST_LEVELS.map((level) => {
          const active = selected === level.id;
          return (
            <button
              key={level.id}
              type="button"
              onClick={() => onSelect(level.id)}
              disabled={disabled}
              className={cn(
                "min-h-[52px] rounded-[18px] border px-2 py-1.5 text-center transition-colors disabled:opacity-60",
                active
                  ? "border-[#5b9fbe]/55 bg-[#bfe2ef] text-[#28536a]"
                  : "border-[#d0a978]/45 bg-[#fffaf0] text-[#6a4a30]",
              )}
              data-asset-path={
                active
                  ? ROASTING_ASSETS.roastLevelButtonOn
                  : ROASTING_ASSETS.roastLevelButtonOff
              }
            >
              <span
                className="mx-auto block h-3.5 w-5 rounded-b-full rounded-t-[80%]"
                style={{ backgroundColor: level.beanTone }}
              />
              <span className="mt-0.5 block text-xs font-black">{level.label}</span>
              <span className="block text-[9px] font-bold opacity-70">
                {level.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function RoastingStartButton({
  status,
  canStart,
  onClick,
}: {
  status: RoastingStatus;
  canStart: boolean;
  onClick: () => void;
}) {
  const label =
    status === "roasting"
      ? "로스팅 중"
      : status === "complete"
        ? "완료 받기"
        : "로스팅 시작";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={status === "idle" && !canStart}
      className="roasting-start-button mt-1.5 flex h-11 w-full items-center justify-center rounded-full border border-[#5b9fbe]/45 bg-[#8fcbe1] text-lg font-black text-[#214b63] disabled:border-[#c4a77e]/40 disabled:bg-[#dac5a0] disabled:text-[#82684b]"
      style={{
        boxShadow:
          "inset 0 2px 0 rgba(255, 255, 255, 0.48), 0 10px 22px rgba(71, 91, 98, 0.18)",
      }}
      data-asset-path={ROASTING_ASSETS.startButton}
    >
      {label}
    </button>
  );
}

function RoastingProgressPanel({
  status,
  remainingSeconds,
  progressPercent,
  roastCost,
  shotYield,
  maxShots,
  currentShots,
}: {
  status: RoastingStatus;
  remainingSeconds: number;
  progressPercent: number;
  roastCost: number;
  shotYield: number;
  maxShots: number;
  currentShots: number;
}) {
  const stateLabel =
    status === "complete"
      ? "로스팅 완료"
      : status === "roasting"
        ? "로스팅 중"
        : "대기 중";
  return (
    <section
      className="roasting-progress-panel mt-1.5 rounded-[22px] border border-[#bd8b5d]/30 bg-[#fff6df]/88 p-2.5"
      style={{ boxShadow: "0 8px 18px rgba(80, 51, 27, 0.1)" }}
      data-asset-path={ROASTING_ASSETS.progressPanel}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold text-[#76563b]/72">진행 상태</p>
          <p className="text-base font-black text-[#513522]">
            {stateLabel}
          </p>
        </div>
        <div className="rounded-2xl bg-[#e9c998]/72 px-3 py-1.5 text-right">
          <p className="text-[10px] font-bold text-[#76563b]/70">남은 시간</p>
          <p className="text-base font-black tabular-nums text-[#513522]">
            {formatSeconds(remainingSeconds)}
          </p>
        </div>
      </div>
      <div
        className="mt-2 h-3 overflow-hidden rounded-full border border-[#a5764f]/24 bg-[#dfc196]"
        data-asset-path={ROASTING_ASSETS.progressTrack}
      >
        <div
          className="h-full rounded-full bg-[#75b5d0]"
          style={{ width: `${progressPercent}%` }}
          data-asset-path={ROASTING_ASSETS.progressFill}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] font-black text-[#76563b]/76">
        <span>원두 {roastCost}개 사용</span>
        <span>
          샷 +{shotYield} · {currentShots}/{maxShots}
        </span>
      </div>
    </section>
  );
}

function RoastingBottomActions() {
  return (
    <nav className="roasting-bottom-actions fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md gap-2.5 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2">
      <button
        type="button"
        disabled
        className="h-10 flex-1 rounded-full border border-[#c4a77e]/45 bg-[#fff3d5]/88 text-sm font-black text-[#7b5b3e]/70"
        data-asset-path={ROASTING_ASSETS.storageButton}
        title="보관함 route 연결 예정"
      >
        보관함
      </button>
      <button
        type="button"
        disabled
        className="h-10 flex-1 rounded-full border border-[#c4a77e]/45 bg-[#fff3d5]/88 text-sm font-black text-[#7b5b3e]/70"
        data-asset-path={ROASTING_ASSETS.completedBeansButton}
        title="완료 원두 목록 연결 예정"
      >
        완료 원두
      </button>
    </nav>
  );
}

function BeanVisual({ bean, size }: { bean: BeanItem; size: "small" | "large" }) {
  const dimension = size === "large" ? 74 : 40;

  if (bean.imageSrc) {
    return (
      <Image
        src={bean.imageSrc}
        alt=""
        width={dimension}
        height={dimension}
        className="h-[80%] w-[80%] object-contain"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    );
  }

  return <BeanFallback size={size} />;
}

function BeanFallback({ size }: { size: "small" | "large" }) {
  return (
    <div
      className={cn(
        "rounded-b-full rounded-t-[80%] bg-[#8a5635]",
        size === "large" ? "h-10 w-7" : "h-7 w-5",
      )}
      style={{ boxShadow: "inset -5px -4px 0 rgba(59, 33, 20, 0.18)" }}
    />
  );
}

function formatSeconds(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}
