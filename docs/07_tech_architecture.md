# 07. TECH ARCHITECTURE

## 추천 기술 스택

Cursor AI 중심, 초보자 친화성, 웹 배포 용이성, UI/모션 품질을 고려하면 아래 조합이 가장 현실적이다.

### 권장 스택
- Framework: **Next.js**
- Language: **TypeScript**
- UI: **React**
- Styling: **Tailwind CSS**
- Animation: **Framer Motion**
- State: **Zustand**
- Sound: **Howler.js**
- Persistence: **localStorage -> 이후 서버 확장**
- Package/Deploy: **Vercel**
- Optional backend later:
  - Convex 또는 Supabase

---

## 왜 이 스택이 맞는가

### Next.js
- 배포가 쉽다.
- 추후 로그인/이벤트/운영툴 연결이 편하다.
- 웹으로 빠르게 검증하기 좋다.

### TypeScript
- Cursor가 구조화된 코드를 만들기 좋다.
- 나중에 시스템이 커져도 유지보수가 쉽다.

### Tailwind
- 감성 UI를 빠르게 반복 가능
- 카드/레이아웃/토큰 관리가 좋다.

### Framer Motion
- 이 프로젝트의 핵심인 마이크로인터랙션 구현에 적합

### Zustand
- 과하지 않으면서도 게임 상태를 분리하기 좋다.

---

## 프로젝트 구조 원칙

- 화면은 `app`
- 재사용 UI는 `components`
- 도메인별 게임 로직은 `features`
- 전역 상태는 `stores`
- 순수 계산 로직은 `lib`
- 정적 데이터는 `data`
- 문서는 `docs`
- Cursor 전달문은 `prompts`

---

## 추천 폴더 구조

```text
coffee-2048/
  docs/
    00_project_overview.md
    01_game_vision.md
    02_core_loop.md
    03_2048_system.md
    04_cafe_system.md
    05_ux_motion.md
    06_content_economy.md
    07_roadmap.md

  prompts/
    cursor_master_prompt.md
    sprint_01_mvp_prompt.md
    sprint_02_meta_prompt.md
    ui_motion_rules.md
    coding_rules.md
    task_template.md

  public/
    images/
    audio/
    icons/

  app/
    layout.tsx
    page.tsx
    globals.css
    puzzle/
      page.tsx
    lobby/
      page.tsx
    upgrades/
      page.tsx
    settings/
      page.tsx

  components/
    common/
      AnimatedButton.tsx
      BottomNav.tsx
      CardShell.tsx
      CountUpText.tsx
      FloatingReward.tsx
      ModalSheet.tsx
      ProgressBar.tsx
      ResourceChip.tsx
      ScreenTransition.tsx
    puzzle/
      GameBoard.tsx
      Tile.tsx
      TileLayer.tsx
      ScorePanel.tsx
      ComboBadge.tsx
      SessionGoalCard.tsx
      PuzzleResultModal.tsx
    lobby/
      LobbyScene.tsx
      RoasterPanel.tsx
      InventoryPanel.tsx
      DisplayShelf.tsx
      CustomerQueue.tsx
      SalesSummaryCard.tsx
    upgrade/
      UpgradeCard.tsx
      UpgradeList.tsx

  features/
    puzzle/
      engine/
        board.ts
        move.ts
        spawn.ts
        merge.ts
        scoring.ts
        specials.ts
      hooks/
        usePuzzleGame.ts
      model/
        puzzleTypes.ts
      utils/
        puzzleFormat.ts
    cafe/
      engine/
        roasting.ts
        production.ts
        selling.ts
        customers.ts
      hooks/
        useCafeLoop.ts
      model/
        cafeTypes.ts
    meta/
      engine/
        progression.ts
        unlocks.ts
        dailyGoals.ts

  stores/
    useGameStore.ts
    usePuzzleStore.ts
    useCafeStore.ts
    useSettingsStore.ts

  hooks/
    useAudio.ts
    useHaptics.ts
    useScreenSize.ts
    useReducedMotion.ts

  lib/
    constants.ts
    easing.ts
    economy.ts
    format.ts
    save.ts
    random.ts

  data/
    tileDefinitions.ts
    menuDefinitions.ts
    upgradeDefinitions.ts
    customerDefinitions.ts
    themeDefinitions.ts

  tests/
    puzzle/
    cafe/
```

---

## 상태 분리 전략

초반에 상태를 깔끔하게 나누는 것이 중요하다.

### 1. Puzzle State
- 보드
- 점수
- 콤보
- 세션 목표
- 종료 상태
- 보상 계산 중간값

### 2. Cafe State
- 인벤토리
- 생산 진행도
- 메뉴 재고
- 고객 큐
- 판매 결과
- 업그레이드 상태

### 3. Meta State
- 레벨
- 해금 상태
- 꾸미기
- 업적/미션
- 설정

---

## 데이터 정의 예시

### tileDefinitions.ts
```ts
export type TileDefinition = {
  level: number;
  value: number;
  key: string;
  label: string;
  rewardBeans: number;
  rewardCoins: number;
  rarity?: "normal" | "special";
};
```

### menuDefinitions.ts
```ts
export type MenuDefinition = {
  id: string;
  name: string;
  beanCost: number;
  brewTimeMs: number;
  sellPrice: number;
  unlockLevel: number;
};
```

### upgradeDefinitions.ts
```ts
export type UpgradeDefinition = {
  id: string;
  name: string;
  description: string;
  category: "roast" | "brew" | "sale" | "customer" | "puzzle";
  levelMax: number;
  costFormula: (level: number) => number;
};
```

---

## 저장 구조

초기엔 localStorage로 충분하다.

### 저장 항목
- 코인
- 자원
- 메뉴 해금/레벨
- 업그레이드 레벨
- 로비 꾸미기
- 퍼즐 최고 기록
- 설정(사운드/진동)

### 주의
- 버전 키를 반드시 둔다.
- 저장 데이터 마이그레이션 함수를 둔다.
- 저장 실패 시 기본값으로 복구 가능해야 한다.

---

## 퍼즐 엔진 구현 원칙

2048 엔진은 UI 컴포넌트와 분리해야 한다.

### 반드시 분리할 것
- 이동 계산
- 합체 판정
- 스폰
- 점수 계산
- 세션 종료 판정

### 이유
- 테스트 가능
- 애니메이션 구현이 쉬워짐
- Cursor가 고치기 쉬움

---

## UI 시스템 구현 원칙

### 공통 컴포넌트 먼저 만들기
- 버튼
- 카드
- 모달
- 자원칩
- 카운트업 숫자
- 전환 컴포넌트

이걸 먼저 만들어야 이후 화면 일관성이 생긴다.

---

## 애니메이션 구현 원칙

- 상태가 변한 뒤 애니메이션을 붙이지 말고
- 처음부터 “상태 + 전환” 구조로 설계한다.

예:
- 타일 이동 ID
- 이전 좌표 / 다음 좌표
- merge source / merge target
- spawn flag

이런 메타 데이터가 있어야 부드러운 보드 연출이 가능하다.

---

## 사운드 구조

```text
public/audio/
  ui/
  puzzle/
  lobby/
  bgm/
```

예시:
- `ui/click-soft.mp3`
- `puzzle/move-soft.mp3`
- `puzzle/merge-mid.mp3`
- `lobby/coin-soft.mp3`
- `bgm/cafe-day-loop.mp3`

오디오 매니저 훅을 분리해 두면 좋다.

---

## Cursor와 잘 맞는 작업 단위

Cursor에게는 아래처럼 “작게 자른 기능 단위”로 시켜야 한다.

좋은 단위:
- 2048 이동 엔진만 만들기
- AnimatedButton 컴포넌트만 만들기
- 저장 유틸만 만들기
- 메뉴 생산 로직만 만들기

나쁜 단위:
- 게임 전체 다 만들어
- 퍼즐도 하고 로비도 하고 애니메이션도 다 해

---

## 개발 우선순위 구조

### Phase 1
- 기본 프로젝트 셋업
- 디자인 토큰
- 공통 UI
- 2048 핵심 엔진

### Phase 2
- 퍼즐 연출
- 세션 보상
- 로비 최소 화면

### Phase 3
- 생산/판매
- 업그레이드
- 저장

### Phase 4
- 고객/주문
- 꾸미기
- 콘텐츠 확장

---

## 기술 결론

이 프로젝트는 “복잡한 백엔드”보다
**프론트엔드 반응감과 구조화된 상태 관리**가 훨씬 중요하다.

따라서 초기엔:
- Next.js
- TypeScript
- Tailwind
- Framer Motion
- Zustand

이 조합으로 시작하는 것이 가장 안정적이다.
