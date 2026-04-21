# Codex 4차 작업 구현 인수인계 문서

## 0. 문서 목적

이 문서는 **Codex로 진행한 최근 구현 결과를 Cursor로 안정적으로 이어받기 위한 구현 인수인계 문서**다.

이 문서는 기획 방향을 다시 정의하는 문서가 아니라,

- 이번에 무엇을 구현했는지
- 어떤 구조가 추가/변경되었는지
- 무엇이 아직 미완료인지
- Cursor가 다음 세션에서 어디부터 봐야 하는지

를 빠르게 전달하는 데 목적이 있다.

---

## 1. 함께 봐야 하는 기준 문서

Cursor는 이 문서 **하나만 읽으면 안 된다.**
반드시 아래 문서와 **함께** 봐야 한다.

### 1-1. 현재 레포에서 실제로 함께 봐야 하는 방향 문서
- `prompts/next_cursor_task.md`
- `docs/14_cursor_handoff_update.md`
- `docs/11_lobby_interaction_direction.md`

주의:
- 과거 문서에서 반복 참조하는 `coffee_2048_project_handoff_master.md`는 **현재 레포에 없다**.
- 따라서 현재 작업 방향, 금지사항, 우선순위는 위 3개 문서를 기준으로 읽는 편이 안전하다.

### 1-2. 이 문서
- `codex_4th_pass_handoff.md`

이 문서는 최근 Codex 작업 결과와 현재 코드 기준 구현 상태를 이어받기 위한 문서다.

---

## 2. 이번 Codex 작업의 큰 목적

이번 Codex 작업의 핵심 목적은,
기존의

**퍼즐 -> 원두/자원 -> 메뉴 제작 -> 판매 -> 코인**

루프 위에,

**계정 레벨 -> 미션 -> 해금 -> 상점 -> 도감 -> 저장**

구조를 얹어 **장기 성장 루프의 뼈대**를 만드는 것이었다.

즉 이번 단계는 손님 메타를 대폭 확장하는 단계가 아니라,
현재 프로젝트에서 상대적으로 비어 있던 **성장 구조와 수집 구조를 붙이는 단계**로 이해하면 된다.

---

## 3. 이번 단계에서 목표로 한 시스템 범위

이번 Codex 작업 범위는 아래였다.

### A. 저장 / 불러오기 / 버전 마이그레이션
- 새로운 성장 시스템을 저장 가능하게 만들기
- 기존 세이브와 충돌을 줄이기

### B. 2048 스킨 상점 / 장착 시스템
- 코인 소모처 추가
- 퍼즐과 메타 루프 연결 강화

### C. 핵심손님 최소 연결 훅
- 대규모 손님 확장이 아니라,
  새 성장 구조와 손님 시스템이 나중에 자연스럽게 이어질 수 있는 최소한의 데이터 훅 준비

### D. 밸런싱 / QA 패스
- 레벨업 속도
- 코인 수급
- 재료 소모
- 레시피 가격
- 도감 진행 속도
- 시간대 상점 체감

---

## 4. 이번 구현에서 기대되는 최종 플레이 루프

현재 시스템은 최종적으로 아래 루프로 닫히는 것을 목표로 한다.

1. 2048 퍼즐 플레이
2. 원두 획득
3. 코인 획득
4. 코인으로 재료 구매
5. 레벨 조건 충족 시 신규 레시피 구매 가능 상태 해금
6. 코인으로 레시피 구매
7. 음료 제작
8. 판매
9. 미션 진척
10. 레벨 상승
11. 더 높은 티어 레시피 / 상점 / 스킨 해금
12. 도감 확장
13. 이후 핵심손님 반응/스토리와 연결

---

## 5. Cursor가 먼저 확인해야 하는 실제 핵심 포인트

Cursor는 코드를 수정하기 전에 아래를 먼저 확인해야 한다.

### 5-1. 저장 구조가 실제로 어디에 붙었는가
- 메인 저장은 `src/stores/useAppStore.ts`의 Zustand `persist`에 붙어 있다.
- 메인 키/버전은 `src/features/meta/storage/storageKeys.ts`에서 관리한다.
  - `STORAGE_KEY = "coffee-2048-save-v2"`
  - `SAVE_SCHEMA_VERSION = 3`
- 메인 저장 병합/보정은 `mergePersisted`, `migratePersistedState`에서 처리한다.
- 손님 애정도/스토리 저장은 별도다.
  - `src/stores/useCustomerStore.ts`
  - `CUSTOMER_STORAGE_KEY = "coffee2048_customers_v1"`
  - `CUSTOMER_STORAGE_VERSION = 6`
- 개발자용 export/import/reset UI는 `src/components/dev/DevDebugPanel.tsx`에서 메인 저장 + 손님 저장을 묶어서 다룬다.
- 디버그 import는 비영속 `saleSession`도 함께 주입할 수 있어, 실제 자동 판매 write path 회귀를 안정적으로 재현할 수 있다. (`saleSession` 자체는 저장 스키마에 포함되지 않음)

### 5-2. 레벨/미션/도감/상점 상태의 source of truth가 어디인가
- 레벨/미션/표준 레시피 해금/구매:
  - `useAppStore.accountLevel`
  - 타입/저장 구조: `src/features/meta/types/gameState.ts`
  - 규칙/정규화: `src/features/meta/progression/missionEngine.ts`
- 재료 인벤토리:
  - `useAppStore.cafeState.materialInventory`
  - 재료 정의: `src/features/meta/economy/materials.ts`
- 도감:
  - `useAppStore.beverageCodex`
  - 도감 단계 계산은 `src/features/meta/content/codex.ts`의 `codexStageFor`
- 시간대 상점 구매 상태:
  - `beverageCodex.purchasedTimeRecipeIds`
  - 구매 후에는 `DrinkMenuId` 기반 공용 레시피 정의(`src/features/meta/economy/recipes.ts`)를 통해 작업대 제작/진열/자동판매/도감 단계 갱신까지 같은 루프를 탄다.
  - ownership 조회/판정은 `src/features/meta/economy/recipeOwnership.ts` helper로 감싸서 일반/시간대 분기를 직접 흩뿌리지 않도록 정리했다.
- 스킨/테마:
  - `useAppStore.cosmetics`
- 손님 애정도/스토리:
  - `useCustomerStore.byId`, `featuredCustomerId`

### 5-3. 스킨 장착이 퍼즐 UI에 어떻게 연결되는가
- 구매/장착 상태는 `useAppStore.cosmetics`가 들고 있다.
- 스킨 정의는 `src/features/meta/cosmetics/puzzleSkins.ts`
- 상점/장착 UI는 `src/features/shop/components/ShopPlaceholderScreen.tsx`
- 퍼즐 반영은 다음 파일이 직접 읽는다.
  - `src/features/puzzle2048/components/PuzzleBoard.tsx`
  - `src/features/puzzle2048/components/PuzzleTile.tsx`
- 장착 즉시 퍼즐 보드/타일 렌더 클래스가 바뀌는 구조다.

### 5-4. 핵심손님 최소 연결 훅이 어디까지 들어갔는가
- 태그 계산 함수는 `src/features/customers/lib/preferenceHooks.ts`
- 자동 판매 배치와의 연결은 `src/stores/useCustomerStore.ts`의 `recordCafeSale`
- 실제 트리거는 `src/components/economy/GlobalCafeSellToast.tsx`
- UI 피드백은 `src/features/customers/components/CustomerPresenceHints.tsx`
- 현재 범위는 “애정도 증가 / 스토리 조각 / 단골 판정 / 선호 태그 ping” 중심이다.
- 대형 보상 시스템이나 주문 시스템까지는 아직 연결되지 않았다.

---

## 6. 현재 코드 기준 실제 구조

아래는 추정이 아니라 **현재 코드 기준으로 확인된 구조**다.

### 6-1. 저장 관련
- 메인 저장:
  - `src/stores/useAppStore.ts`
  - 저장 대상: `playerResources`, `puzzleProgress`, `cafeState`, `accountLevel`, `beverageCodex`, `meta`, `settings`, `bm`, `cosmetics`, `passProgress`, `liveOps`, `ownedProductIds`
- 손님 저장:
  - `src/stores/useCustomerStore.ts`
  - 저장 대상: `byId`, `featuredCustomerId`, 일일 quota 관련 필드
- 비저장 런타임:
  - `saleSession`
  - `lastCounterSalePing`
  - `lastStoryUnlockPing`
  - `lastRegularGiftPing`
  - `lastPreferenceHookPing`
- 메인 저장 키/버전:
  - `src/features/meta/storage/storageKeys.ts`
- 메인 저장은 정규화 중심 마이그레이션이고, 손님 저장은 버전별 보정 체인이 더 두껍다.

### 6-2. 성장 / 상점 / 도감 관련
- 레벨/미션:
  - `src/features/meta/progression/missionEngine.ts`
  - `src/features/meta/progression/missionDefinitions.ts`
  - `src/features/meta/progression/levelBands.ts`
- 재료/레시피:
  - `src/features/meta/economy/materials.ts`
  - `src/features/meta/economy/recipes.ts`
  - `src/features/meta/economy/pricing.ts`
  - `src/features/meta/economy/crafting.ts`
  - `src/features/meta/economy/recipeOwnership.ts`
- 공용 메뉴/진열 판매:
  - `src/features/meta/balance/cafeEconomy.ts`
  - `src/features/lobby/components/CafeLoopSection.tsx`
  - `src/features/menu/components/ShowcaseMenuScreen.tsx`
- 도감/음료 데이터:
  - `src/features/meta/content/beverages.ts`
  - `src/features/meta/content/codex.ts`
- 시간대 상점:
  - `src/features/meta/content/timeShop.ts`
  - `src/features/timeShop/components/TimeShopScreen.tsx`
- 퍼즐 스킨:
  - `src/features/meta/cosmetics/puzzleSkins.ts`

### 6-3. 핵심손님 최소 연결 훅 관련
- 손님 데이터:
  - `src/data/customers/coreCustomers.ts`
  - `src/data/customers/regularCustomers.ts`
- 애정도 계산:
  - `src/features/customers/lib/saleAffection.ts`
- 선호 태그 훅:
  - `src/features/customers/lib/preferenceHooks.ts`
- 현재는 판매 배치 기반의 최소 연결 훅이며, UI 연출과 저장은 있으나 대형 메타 시스템은 아직 아니다.

---

## 7. Cursor가 가장 먼저 해야 하는 일

Cursor는 바로 구현부터 들어가지 말고 아래 순서로 시작해야 한다.

### Step 1. 현재 authoritative 파일 확인
현재 구조에서 실제 source of truth가 되는 파일을 먼저 정리한다.

### Step 2. 코드와 문서의 차이점 확인
아래가 일치하는지 본다.
- 저장 대상
- 해금 대상
- 스킨 적용 범위
- 손님 훅 범위

### Step 3. 미완료/임시 처리 항목 찾기
아래 같은 항목을 찾는다.
- TODO
- FIXME
- placeholder
- mock 데이터
- 하드코딩된 시간대 기준
- 저장 키 분리로 인한 누락 가능성

### Step 4. 그 다음 이번 세션 목표만 수행
한 번에 하나의 목적만 진행한다.

---

## 8. Cursor에게 넘겨야 하는 실제 체크리스트

아래는 Cursor가 코드를 열고 바로 확인해야 하는 체크리스트다.

### 파일 구조 체크
- [x] 레벨 상태: `src/stores/useAppStore.ts`, `src/features/meta/progression/missionEngine.ts`
- [x] 미션 정의: `src/features/meta/progression/missionDefinitions.ts`
- [x] 재료/레시피/음료 데이터: `src/features/meta/economy/materials.ts`, `src/features/meta/economy/recipes.ts`, `src/features/meta/content/beverages.ts`
- [x] 저장 로직: `src/stores/useAppStore.ts`, `src/stores/useCustomerStore.ts`, `src/features/meta/storage/storageKeys.ts`
- [x] 시간대 상점: `src/features/meta/content/timeShop.ts`, `src/features/timeShop/components/TimeShopScreen.tsx`
- [x] 스킨 상점 / 장착: `src/features/shop/components/ShopPlaceholderScreen.tsx`, `src/features/meta/cosmetics/puzzleSkins.ts`
- [x] 손님 훅 데이터/로직: `src/data/customers/*`, `src/features/customers/lib/preferenceHooks.ts`, `src/stores/useCustomerStore.ts`

### 저장 체크
- [x] level state 저장됨 (`accountLevel`)
- [x] mission progress 저장됨 (`accountLevel.missionProgress`)
- [x] recipe unlock 저장됨 (`accountLevel.unlockedRecipeIds`)
- [x] recipe purchase 저장됨 (`accountLevel.purchasedRecipeIds`, `beverageCodex.purchasedTimeRecipeIds`)
- [x] material stock 저장됨 (`cafeState.materialInventory`)
- [x] codex state 저장됨 (`beverageCodex`)
- [x] 시간대 레시피 제작/판매 결과 저장됨 (`cafeState.menuStock`, `cafeState.craftedDrinkIds`, `beverageCodex.entries`)
- [x] equipped skin 저장됨 (`cosmetics`)
- [x] save version 존재함 (메인 3 / 손님 6)
- [x] migration 처리 존재함 (`migratePersistedState`, `useCustomerStore.migrate`)

### UI 체크
- [x] 레벨 UI: `src/features/lobby/components/AccountLevelCard.tsx`
- [x] 미션 진행도: `AccountLevelCard` 내부 mission 슬롯 표시
- [x] 상점 상태: `src/features/lobby/components/CafeShopSection.tsx`, `src/features/shop/components/ShopPlaceholderScreen.tsx`
- [x] 도감 상태: `src/features/codex/components/BeverageCodexScreen.tsx`
- [x] 시간대 레시피 구매 후 작업대/쇼케이스 노출: `src/features/lobby/components/CafeLoopSection.tsx`, `src/features/menu/components/ShowcaseMenuScreen.tsx`
- [x] 스킨 장착 반영: `src/features/puzzle2048/components/PuzzleBoard.tsx`, `src/features/puzzle2048/components/PuzzleTile.tsx`
- [x] ownership 조회 공용 helper 사용: `src/features/meta/economy/recipeOwnership.ts`, `src/features/meta/content/codex.ts`, `src/features/timeShop/components/TimeShopScreen.tsx`
- [x] ownership 회귀 자동화 테스트: `tests/visual/recipe-ownership.spec.ts`, `tests/visual/ownershipTestUtils.ts`

### 연결 체크
- [x] 음료 카테고리 기반 손님 훅 호출 가능
- [x] 재료 태그 기반 손님 훅 호출 가능
- [x] 시간대 태그 기반 훅 호출 가능
- [x] 희귀도 태그 기반 훅 호출 가능

---

## 9. 현재 코드 기준 완료 여부

### 9-1. 실제 완료된 항목
- [x] 메인 저장/불러오기 구현 완료 (`useAppStore`)
- [x] 손님 저장/불러오기 구현 완료 (`useCustomerStore`)
- [x] save version / migration 구현 완료
- [x] 2048 스킨 상점 구현 완료
- [x] 스킨 장착 후 퍼즐 반영 완료
- [x] 레벨/미션/표준 레시피 구매 루프 구현 완료
- [x] 도감 저장 및 단계 표시 구현 완료
- [x] 시간대 상점 구매/제작/판매/도감/미션/저장 연결 구현 완료
- [x] 일반/시간대 레시피 ownership 조회 helper 정리 완료
- [x] 일반/시간대 레시피 ownership 핵심 회귀 자동화 테스트 추가 완료
- [x] 핵심손님 최소 연결 훅 구현 완료
- [x] 디버그 export/import/reset에서 메인 저장 + 손님 저장 번들 처리 완료
- [x] 레벨/미션/스킨/손님 저장 persistence 회귀 테스트 추가 완료 (`tests/visual/meta-persistence.spec.ts`)
- [x] 실제 판매 write path 기반 손님 애정도/스토리 회귀 테스트 추가 완료 (`tests/visual/customer-sale-flow.spec.ts`)
- [x] 실제 판매 write path 기반 단골 판정(`isRegular`) 회귀 테스트 추가 완료 (`tests/visual/customer-sale-flow.spec.ts`)

### 9-2. 미완료 또는 임시 처리 항목
- [x] `/shop`은 실결제 없는 placeholder 상태
- [x] `passProgress`, `liveOps`는 저장 슬롯 중심이고 보상 규칙은 후속
- [x] 시간대 레시피 구매 ownership은 여전히 `beverageCodex.purchasedTimeRecipeIds`에 별도 저장됨
- [x] 레벨/미션/스킨/손님 저장 persistence baseline은 `tests/visual/meta-persistence.spec.ts`로 고정됐음
- [x] 손님 판매 write path baseline은 `tests/visual/customer-sale-flow.spec.ts`로 고정됐지만, 선호 보너스 세부값 / 일일 quota rollover / 대표 손님 교체까지는 아직 자동화가 얇음
- [x] 시간대 판정은 로컬 시간 하드코딩 기준
- [x] `coffee_2048_project_handoff_master.md` 참조는 남아 있지만 실제 파일은 레포에 없음

### 9-3. 현재 구조 기준 핵심 파일 목록

- 저장 핵심:
  - `src/stores/useAppStore.ts`
  - `src/stores/useCustomerStore.ts`
  - `src/features/meta/storage/storageKeys.ts`
- 성장/도감/상점 핵심:
  - `src/features/meta/progression/missionEngine.ts`
  - `src/features/meta/progression/missionDefinitions.ts`
  - `src/features/meta/progression/levelBands.ts`
  - `src/features/meta/content/codex.ts`
  - `src/features/meta/content/timeShop.ts`
  - `src/features/meta/cosmetics/puzzleSkins.ts`
- 신중 수정 파일:
  - `src/stores/useAppStore.ts`
  - `src/stores/useCustomerStore.ts`
  - `src/features/meta/types/gameState.ts`
  - `src/features/puzzle2048/components/*`

---

## 10. 이번 단계에서 남아 있을 가능성이 높은 리스크

아래는 이번 구현 이후 자주 생길 수 있는 리스크다.

### 10-1. 세이브 스키마 충돌
- 메인 저장과 손님 저장이 물리적으로 분리되어 있어, 이후 스키마 변경 시 두 store를 함께 고려해야 함
- `STORAGE_KEY` 문자열은 `v2`인데 실제 schema version은 `3`이라 이름상 혼선이 있음

### 10-2. 상태 source of truth 중복
- 표준 레시피는 `accountLevel`, 시간대 레시피는 `beverageCodex.purchasedTimeRecipeIds`에 저장되어 기준이 분리돼 있음
- 제작/판매/상점/도감 조회는 `recipeOwnership.ts` helper로 정리됐지만, write path 자체는 여전히 store 내 다른 필드에 남아 있어 후속 확장 시 저장 구조 통합 여부를 별도 결정해야 함

### 10-3. 시간대 상점 하드코딩
- 로컬 시간 기준이 지나치게 하드코딩되어 있으면 테스트/확장 시 불편함
- 현재 ownership 회귀 테스트는 브라우저 시간 mocking으로 고정됐지만, 다른 시간대 메타 조합까지 한 번에 다루는 공용 테스트 유틸은 아직 얇다

### 10-4. placeholder 구조의 오해
- `/shop`은 실결제/BM 구현이 아니라 로컬 placeholder 저장이다
- `passProgress`, `liveOps`는 저장/표시 중심이며 실제 시즌 보상 구조가 아직 닫히지 않았다

### 10-5. 손님 최소 연결 훅의 실사용 부재
- 손님 훅은 애정도/스토리/단골 판정 write path까지는 회귀가 고정됐지만, 선호 보너스 세부값·일일 quota rollover·다음 날 대표 손님 교체까지는 아직 얇다
- 주문 시스템/특별 원두/대형 보상 구조와는 아직 분리돼 있다

---

## 11. Cursor가 다음으로 추천받아야 하는 작업 우선순위

이번 문서를 읽은 뒤 Cursor는 보통 아래 순서로 이어가는 것이 좋다.

### 1순위
선호 메뉴 판매 보너스(write path) 회귀를 실제 자동 판매 흐름으로 고정

### 2순위
오늘의 손님 daily quota 소진 / 다음 날 rollover / 대표 손님 교체 회귀를 좁은 범위로 고정

### 3순위
단골 흔적/팁 ping이 실제 판매 뒤 표시되는지 최소 UI 회귀를 추가로 고정

### 4순위
밸런싱 2차 조정
- 레벨업 속도
- 코인 수급
- 재료 가격
- 레시피 가격
- 도감 진행 속도

---

## 12. Cursor에게 줄 다음 세션 전달 템플릿

아래 형식으로 Cursor에게 작업을 넘기면 된다.

```md
먼저 아래 문서를 읽고 현재 프로젝트 상태를 파악해라.

1. 현재 세션 지시
- prompts/next_cursor_task.md

2. 최신 구현 인수인계 문서
- docs/codex_4th_pass_handoff.md

3. 방향/금지사항
- docs/14_cursor_handoff_update.md
- docs/11_lobby_interaction_direction.md

이후 해야 할 일:
- 문서와 현재 코드를 대조해서 source of truth를 먼저 정리
- 문서와 실제 코드가 어긋나는 부분이 있는지 먼저 정리
- 그 다음 이번 세션 목표만 수행

이번 세션 목표:
[한 가지 목표만 적기]

수정 범위:
[허용 파일]

수정 금지:
[금지 파일]

완료 기준:
[완료 기준]

작업 후 아래 형식으로 보고:
1. 작업 요약
2. 변경 파일 목록
3. 구현 내용
4. 검증 방법
5. 남은 이슈
6. 다음 추천 작업
```

---

## 13. 마지막 정리

이 문서는 단독 기준 문서가 아니다.

- 현재 레포에 없는 `coffee_2048_project_handoff_master.md`를 전제로 읽으면 혼란이 생긴다.
- 실제 작업 기준은 `prompts/next_cursor_task.md`, `docs/14_cursor_handoff_update.md`, `docs/11_lobby_interaction_direction.md`, 그리고 이 문서다.

이번 단계의 핵심은,

**손님 메타를 더 크게 벌리기 전에, 성장 구조 / 저장 / 스킨 / 도감 / 상점 구조를 실제 플레이 가능한 장기 루프로 닫는 것**

이었다.

Cursor는 다음부터 이 문서를 기준으로,
"무엇을 새로 만들지"보다 먼저
"이미 무엇이 구현되었고 무엇이 아직 비어 있는지"
를 확인하고 이어서 작업해야 한다.
