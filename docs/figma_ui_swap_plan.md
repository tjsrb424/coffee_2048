# Figma UI Swap Plan

## 1. 목적
이 문서는 현재 레포의 UI를 **최종 비주얼이 아닌 기능 셸(functional shell)** 로 정의하고,
이후 Figma 기준안으로 로비/상점/카운터/쇼케이스/HUD/바텀시트 등을
**쉽게 교체할 수 있는 상태**를 만들기 위한 기준 문서다.

핵심 목표는 아래다.

- 기능과 상태 흐름을 먼저 지킨다
- 저장/회귀 안정성을 먼저 지킨다
- 화면 구조 분리를 우선한다
- 지금 임시 UI의 spacing/padding/polish에 과투자하지 않는다

---

## 2. 왜 지금 UI를 기능 셸로 보는지
현재 프로젝트는 1.0 출시선 기준으로

- 퍼즐 코어
- 카페 운영 루프
- 성장 메타
- 손님 메타 v1
- 오프라인 보상 1차

를 먼저 닫는 단계다.

따라서 지금 UI의 우선순위는

- 상태가 올바르게 보이는가
- 버튼/패널 진입이 끊기지 않는가
- 저장/새로고침/날짜 경계가 흔들리지 않는가
- 테스트와 QA 기준점이 유지되는가

이지,

- 여백이 최종 시안처럼 정교한가
- 카드 모서리/패딩/일러스트 배치가 최종 비주얼에 가까운가

가 아니다.

즉 지금 UI는 **기능을 확인하는 셸**이고,
최종 시각 품질은 Figma 기준 전체 교체 단계에서 다시 맞춘다.

---

## 3. 교체 대상 화면/영역

### 3-1. Figma 교체 예정 영역
아래는 Figma 기준안으로 **외형 교체를 전제**해야 하는 영역이다.

- `src/features/lobby/components/LobbyScreen.tsx`
  - 로비 상단 타이틀
  - 로비 타일 그리드
  - 상단 메뉴 버튼
  - 로비 카드 배치
- `src/features/lobby/components/ResourceBar.tsx`
  - 상단 HUD 전체 외형
- `src/features/lobby/components/LobbyBottomSheet.tsx`
  - 바텀시트 헤더/본문/닫기 버튼 레이아웃
- `src/features/lobby/components/CafeLoopSection.tsx`
  - 로스터/제작/진열 패널의 카드 외형
- `src/features/lobby/components/CafeShopSection.tsx`
  - 로비 상점 시트 외형
- `src/features/timeShop/components/TimeShopScreen.tsx`
  - 시간대 상점 헤더/카드 레이아웃
- `src/features/menu/components/ShowcaseMenuScreen.tsx`
  - 쇼케이스 요약 화면 외형
- `src/features/shop/components/ShopPlaceholderScreen.tsx`
  - 상점 셸 전체 외형
- `src/features/lobby/components/OfflineSalesCard.tsx`
  - 오프라인 보상 카드 외형
- `src/features/customers/components/CustomerPresenceHints.tsx`
  - 로비/카운터 손님 힌트 카드 외형
- `src/features/lobby/components/AccountLevelCard.tsx`
  - 성장 카드 외형

### 3-2. 기능 셸로 유지할 영역
아래는 Figma 교체 이후에도 **기능 셸로 유지**되어야 하는 영역이다.

- 화면 라우트와 진입 구조
  - `/lobby`
  - `/cafe`
  - `/menu`
  - `/time-shop`
  - `/shop`
- 바텀시트 열기/닫기 흐름
- 로스터/쇼케이스/카운터/상점의 기능 분기
- 오프라인 보상 claim 흐름
- 손님 힌트와 판매 write path 연결
- 레벨/미션/해금 preview 흐름
- HUD 숫자 반영 구조

즉, **외형은 갈아끼워도 기능 경로는 유지**해야 한다.

---

## 4. 유지해야 할 기능 상태

### 4-1. source of truth
아래 상태는 UI 교체와 무관하게 유지되어야 한다.

- `useAppStore.playerResources`
- `useAppStore.cafeState`
- `useAppStore.accountLevel`
- `useAppStore.beverageCodex`
- `useAppStore.meta`
- `useAppStore.cosmetics`
- `useCustomerStore.byId`
- `useCustomerStore.featuredCustomerId`
- `useCustomerStore.saleSession`

### 4-2. UI가 계속 연결해야 할 대표 액션
- `consumePuzzleHeart`
- `roastOnce`
- `craftDrink`
- `startDisplaySelling`
- `stopDisplaySelling`
- `purchaseMaterial`
- `purchaseRecipe`
- `purchaseTimeShopRecipe`
- `claimOfflineReward`
- `patchSettings`
- 손님 메타 관련 판매 write path 트리거

### 4-3. 교체 중에도 유지해야 할 기능 흐름
- 퍼즐 진입
- 로스터 진입
- 쇼케이스 제작
- 카운터 판매 시작/중지
- 상점 진입
- 시간대 상점 구매
- 오프라인 보상 수령
- 손님 힌트/스토리/단골 ping 노출

---

## 5. 유지해야 할 test id / QA 포인트

### 5-1. 유지해야 할 test id / id / 접근성 앵커
현재 테스트와 기능 흐름이 직접 기대는 기준점은 아래다.

- `data-testid="lobby-reference-tile-grid"`
- `data-testid="lobby-reference-tile-roast"`
- `data-testid="lobby-reference-tile-showcase"`
- `data-testid="lobby-reference-tile-counter"`
- `data-testid="lobby-reference-tile-shop"`
- `id="lobby-cafe-craft"`
- `id="lobby-cafe-display"`
- `aria-label="메뉴 열기"`
- `aria-label="레벨 {n} 성장 열기"`
- 바텀시트 닫기 접근성 라벨

### 5-2. 현재 텍스트 기반 QA 포인트
아래는 테스트가 텍스트에도 묶여 있으므로, Figma 교체 시 한 번에 바꾸지 말아야 한다.

- `오프라인 보상`
- `보상 받기`
- `판매 중지`
- `제작하기`
- `오늘의 손님 · ...`
- `단골`
- `곧 열림`
- `새로 열림`
- `지금 추천`

### 5-3. QA 원칙
- Figma 교체 전까지는 위 기준점을 유지한다
- Figma 교체 단계에서 문구 변경이 필요하면 **테스트 갱신과 같은 세션에서** 같이 바꾼다
- 가능하면 텍스트 의존 테스트를 점진적으로 `data-testid`나 더 안정적인 앵커로 옮긴다

---

## 6. 교체 전에 하면 좋은 구조 정리

### 6-1. 지금 미리 분리해두면 좋은 컴포넌트
- `LobbyScreen`
  - 화면 오케스트레이션과 타일 비주얼을 더 분리
- `CafeLoopSection`
  - `roast`, `craft`, `display`를 뷰모델/패널 단위로 분리
- `ResourceBar`
  - HUD 상태 선택과 렌더를 분리
- `TimeShopScreen`
  - 화면 컨테이너 / 헤더 / 리스트 아이템 분리
- `CustomerPresenceHints`
  - 손님 상태 계산과 카드 렌더 분리
- `ShopPlaceholderScreen`
  - 실제 출시 셸과 placeholder BM 데모 영역 분리

### 6-2. 현재 구조에서 교체를 어렵게 만드는 결합 지점
- UI 컴포넌트가 `useAppStore`, `useCustomerStore`를 직접 많이 읽는다
- 표현 컴포넌트 내부에 도메인 문구와 로직 분기가 함께 있다
- 일부 테스트가 `id`, `data-testid`보다 **텍스트 내용**에 더 강하게 묶여 있다
- 이미지 위치/패딩이 특정 일러스트 크기에 맞춰 하드코딩돼 있다
- 로비 타일/시트 헤더가 현재 비주얼 자산에 맞춘 치수에 묶여 있다

### 6-3. 구조 정리 방향
- 상태 선택은 container/hook 쪽으로 당긴다
- presentational component는 props 기반으로 받는다
- 슬롯 이름과 진입 포인트를 먼저 고정한다
- `route -> shell -> section -> action` 흐름을 유지한다

---

## 7. 교체 시 하지 말아야 할 것
- 퍼즐 코어 규칙과 연결해서 UI를 갈아엎지 말 것
- 저장 스키마를 건드리지 말 것
- 손님 시스템 write path를 같이 리라이트하지 말 것
- BM 실구현을 UI 교체와 한 세션에 섞지 말 것
- spacing/padding/polish 수정과 상태 리팩터링을 동시에 크게 하지 말 것
- test id / id / route / source of truth를 한 번에 바꾸지 말 것
- Figma 자산 배치 때문에 기능 액션 이름과 store 구조를 바꾸지 말 것

---

## 8. 교체 우선순위

### 1순위: 공통 셸
- `AppShell`
- `ResourceBar`
- `LobbyBottomSheet`
- 로비 상단 메뉴/공통 패널 헤더

### 2순위: 로비 메인
- `LobbyScreen`
- 로비 타일 그리드
- 로비 상단 타이틀/배경 카드

### 3순위: 로비 내부 기능 패널
- `CafeLoopSection`
  - 로스터
  - 제작
  - 진열/판매
- `CafeShopSection`
- `OfflineSalesCard`
- `AccountLevelCard`
- `CustomerPresenceHints`

### 4순위: 별도 화면
- `TimeShopScreen`
- `ShowcaseMenuScreen`
- `ShopPlaceholderScreen`

### 4-1. 이후 Figma 교체 때 다시 열릴 가능성이 있는 비출시 영역
- `/shop`
  - 현재는 일반 진입점에서 숨긴 비출시 데모 보관함
  - 출시 범위가 넓어지면 Figma 기준으로 다시 열 수 있다
- `/extension` 내부의 `pass/liveOps` 메모 영역
  - 현재는 설비 업그레이드만 1.0 포함
  - 시즌 패스 / 이벤트 / 확장 손님 표면은 출시 후 예정 메모로만 둔다

---

## 9. 다음 세션에 넘길 원칙
다음 Figma 기준 작업 세션에서는

- 현재 UI를 “기능 셸”로 유지한다는 전제를 먼저 읽고
- `release_scope_1_0.md`를 함께 보며
- `source of truth`, `test id`, `QA 앵커`, `교체 우선순위`

를 확인한 뒤 작업해야 한다.

즉 다음 단계의 목표는
**지금 UI를 더 예쁘게 다듬는 것**이 아니라,
**Figma 기준 비주얼을 현재 기능 셸 위에 안전하게 입히는 것**이다.
