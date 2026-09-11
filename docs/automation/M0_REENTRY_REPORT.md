# Coffee 2048 M0 Reentry Report

## 문서 상태

- M0 상태: `DONE`
- 기준 브랜치: `main`
- 분석 브랜치: `automation/m0-reentry-system`
- 분석 원칙: 제품 코드는 수정하지 않고 실제 코드/문서/자산/CI만 재점검
- 다음 권장 단계: `M1 — 1.0 기준선 복구 및 Source-of-Truth 정렬`

---

# 1. Executive Summary

Coffee 2048은 5월 시점의 단순 프로토타입보다 훨씬 많이 진행되어 있다.

현재 실제 저장소에는 다음이 이미 존재한다.

- 손맛 중심 2048 퍼즐 코어
- 퍼즐 결과/보상/재화 반영
- 고품질 로비 1차 비주얼
- 로스팅 화면
- 음료 제작/워크벤치 화면
- 계산대/판매 화면
- 재료/레시피 구매
- 자동 판매 및 오프라인 보상
- 계정 레벨/미션/해금
- 음료 도감
- 시간대 레시피/상점
- 설비 업그레이드
- 메인 세이브 및 migration
- 별도 고객 세이브 및 migration
- 손님 100명 규모 풀
- 오늘의 손님/애정도/선호 메뉴/단골/스토리/흔적
- 보상형 광고 2종에 대한 최소 구현/추상화
- 데스크톱/모바일 Playwright 회귀 테스트

### 현재 완성도 — M0 추정

이 수치는 코드/CI/화면 Audit을 바탕으로 한 내부 판단이며 공식 지표가 아니다.

- **1.0 기능 구조 완성도: 약 80~85%**
- **UI 비주얼 완성도: 약 70%**
- **출시 안정성/회귀 기준선: 약 65~70%**

기능이 부족해서 낮은 것이 아니라, 최근 비주얼 화면 교체 이후 **새 UI와 실제 게임 도메인 로직/테스트가 일부 분리되어 있다는 점**이 가장 큰 리스크다.

### 현재 플레이 가능 범위

핵심 루프 자체는 코드상 닫혀 있다.

`퍼즐 → 보상 → 로비 → 로스팅 → 제작 → 진열/판매 → 코인/손님 메타 → 성장/저장`

다만 실제 사용자가 로비에서 들어가는 최신 비주얼 화면 일부는 이전의 검증된 `CafeLoopSection` 도메인 흐름과 의미가 완전히 일치하지 않는다.

### 가장 큰 문제 3개

1. **새 비주얼 UI와 실제 source of truth 불일치**
   - 워크벤치 일부 레시피/재료 수치가 하드코딩되어 있다.
   - 계산대의 판매 음료 선택은 로컬 UI 상태지만 실제 판매 엔진의 판매 대상을 제한하지 않는다.
   - 로스팅의 원두 종류/배전 단계 선택은 풍부하지만 실제 경제 반영은 공통 `roastOnce()`로 귀결된다.

2. **회귀 테스트가 구 UI 계약을 기대함**
   - 현재 계산대는 `판매 중` 상태인데 테스트는 `판매 중지` 버튼을 기대한다.
   - 현재 손님 화면은 `소연 방문 예정`처럼 분리 표시하지만 테스트는 `오늘의 손님 · 소연`을 기대한다.
   - 현재 도감은 수집/제작 단계 중심인데 recipe ownership 테스트는 도감에서 `구매` 문구를 기대한다.

3. **비주얼 테스트 기준선/품질 게이트가 완전히 녹색이 아님**
   - Linux용 lobby/puzzle screenshot baseline이 없어 일부 시각 테스트가 실패한다.
   - CI에서 lint/typecheck/build는 성공하지만 Playwright 전체 게이트는 실패 중이다.

---

# 2. 실제 구현 상태

## 2-1. Route / Screen Inventory

현재 production build에서 확인된 주요 route:

- `/` → `/lobby` redirect
- `/lobby`
- `/puzzle`
- `/lobby/roaster`
- `/lobby/workbench`
- `/lobby/counter`
- `/lobby/shop`
- `/cafe`
- `/codex`
- `/drinkdex`
- `/menu`
- `/settings`
- `/shop`
- `/time-shop`
- `/extension`

### 판정

- `/lobby`, `/puzzle`: 현재 메인 플레이의 핵심 화면
- `/lobby/roaster`, `/lobby/workbench`, `/lobby/counter`: 최신 비주얼 전용 화면. 외형은 크게 진전됐지만 일부 도메인 연결 정리가 필요
- `/cafe`: 시각적으로는 이전 기능 셸에 가깝지만 실제 경제/제작/판매 도메인 source of truth 검증에 매우 중요
- `/lobby/shop`: 실제 재료/레시피 구매 기능을 담고 있으나 UI에서 스스로 `(임시 화면)`이라고 명시
- `/codex`: 현재 음료 도감/수집 화면. 구매 UI가 아님
- `/shop`: 1.0 일반 진입점에서 숨기는 비출시 BM 데모 성격
- `/extension`: 1.0 업그레이드와 이후 확장 placeholder가 공존

---

## 2-2. Puzzle

### 상태: `STABLE CORE / KEEP`

확인된 구조:

- `src/features/puzzle2048/engine/boardUtils.ts`
- `mergeLine.ts`
- `moveBoard.ts`
- `spawn.ts`
- `gameOver.ts`
- 별도 session store / board / tile / screen 구조

확인된 기능:

- 4x4 board
- tile spawn
- 상하좌우 move/merge
- score
- game over
- move/spawn animation
- keyboard/touch 입력
- puzzle result → pending claim → meta reward
- puzzle progress 저장
- puzzle skin/theme 구조

### 비주얼

현재 모바일/데스크톱 screenshot 기준 브랜드 일관성과 전체 화면 구성은 높은 편이다.
Playwright screenshot에서 board가 분홍색으로 보이는 것은 테스트가 board를 `mask`하기 때문이며 실제 게임 UI 문제로 판정하지 않는다.

### M1 판단

퍼즐 엔진 자체를 다시 만들 이유가 없다.
M1에서 퍼즐은 core-loop smoke test와 보상/저장 회귀 확인만 한다.

---

## 2-3. Lobby

### 상태: `POLISHED V1 / KEEP`

현재 로비는 1차 비주얼 교체가 실제 코드에 반영되어 있다.

- 큰 Coffee 2048 브랜드 로고
- 로스팅 / 음료 만들기 / 카운터 / 상점 카드
- PLAY 진입
- resource HUD
- onboarding
- 모바일 중심 고정 폭 구성

### 강점

- 게임 정체성이 명확하다.
- 카드 4종의 시각적 품질이 높다.
- 퍼즐과 운영으로 들어가는 구조가 한 화면에 읽힌다.

### UX 리스크

모바일 Playwright 실제 screenshot에서는 onboarding 안내 카드가 하단 PLAY 영역을 가리는 구간이 있다.
핵심 기능 blocker는 아니지만 M2 visual/UX pass에서 우선 점검할 가치가 있다.

---

## 2-4. Cafe Loop / Domain Source of Truth

### 상태: `FUNCTIONAL / IMPORTANT SOURCE OF TRUTH`

`CafeLoopSection`은 외형보다 실제 도메인 연결이 강하다.

실제 상태를 사용한다.

- beans
- espresso shots
- menu stock
- material inventory
- account level
- beverage codex
- actual craft validation
- actual craft action
- start/stop display selling
- current sell price

따라서 새 비주얼 화면을 정리할 때 이 구현의 도메인 규칙을 재사용해야 한다.

---

## 2-5. Roaster

### 상태: `VISUAL ADVANCED / DOMAIN PARTIAL`

최신 화면에는:

- 3종 원두 선택
- 배전 단계(light/medium/dark)
- 배전 시간
- 진행률
- 원두별 태그/설명

이 있다.

하지만 최종 실제 경제 적용은 `roastOnce()`를 호출하고, 선택한 원두/배전 단계 자체가 현재 저장/경제 결과에 별도 영향을 주지 않는다.

### M1 원칙

1.0 범위에 없는 새로운 원두 경제 시스템을 자동으로 추가하지 않는다.
대신 화면이 실제 현재 mechanics보다 더 많은 의미를 약속하지 않도록 정렬한다.

권장:

- 현재 1.0 `roastOnce` mechanics를 source of truth로 유지
- 원두/배전 선택을 실제 효과가 있는 것처럼 오해시키는 부분은 줄이거나 명확히 표현
- 특별 원두/배전별 능력은 post-1.0 별도 승인 범위로 남김

---

## 2-6. Workbench / Drink Station

### 상태: `VISUAL ADVANCED / SOURCE-OF-TRUTH DRIFT`

최신 Workbench에는 여러 레시피 카드, 카테고리, 재료 표시, 제작 UX가 존재한다.

문제:

- recipe 배열이 화면 내부에 별도 하드코딩되어 있다.
- 일부 재료 `have` 값 역시 프리뷰 상수다.
- `craftId`가 실제 `DrinkMenuId`에 연결된 일부 메뉴만 실제 `craftDrink()`가 수행된다.
- 반면 `/cafe`의 기존 `CafeLoopSection`은 실제 `visibleMenuOrder`, `validateCraftDrink`, 실제 material inventory를 사용한다.

### M1 핵심 작업

워크벤치가 별도 mock 데이터가 아니라 기존 meta/economy source of truth에서 recipe/material/craftability를 직접 읽도록 통합한다.

---

## 2-7. Counter / Sales

### 상태: `VISUAL ADVANCED / SEMANTIC DRIFT`

현재 계산대에는:

- 오늘의 손님
- 추천 메뉴
- 판매할 음료 최대 3개 선택
- 판매 진행률
- 남은 시간
- 대기 손님 수
- 준비 수량
- 완료 판매/보관함 UI

가 존재한다.

그러나 `selectedDrinkIds`는 화면의 local state이고, `handleStartSale()`은 실제로 `startDisplaySelling()`만 호출한다.
즉 화면에서 고른 음료가 현재 store의 자동판매 대상을 제한하는 source of truth는 아니다.

### M1 권장 원칙

새로운 판매 필터 시스템을 즉시 추가하지 않는다.

우선 기존 자동판매 mechanics를 유지하면서 최신 Counter UI를 실제 store 상태에 맞게 정렬한다.

- 실제로 의미 없는 선택을 기능처럼 보이지 않게 정리하거나
- 현재 mechanics에서 실제 의미가 있는 stock/status 표시로 전환

판매 대상 선택을 진짜 mechanics로 추가하려면 save/offline 판매 정책 영향까지 검토해야 하므로 별도 product decision으로 본다.

---

## 2-8. Customer / Relationship

### 상태: `1.0 V1 IMPLEMENTED`

현재:

- core customers 5명
- regular customer pool 95명 이상 보장
- 총 100명 규모
- static profile / runtime state 분리
- featured customer
- featured daily quota
- sale session
- affection
- preferred menu bonus
- regular status
- story index
- gift/trace ping
- preference hook
- 날짜 rollover

가 존재한다.

고객 store는 별도 persist/migration을 가지고 있다.

### 중요한 판단

과거 roadmap에서는 손님 개인화를 다음 최우선으로 잡았지만, 최신 `release_scope_1_0.md`는 현재 손님 meta v1을 1.0 완료선으로 본다.

따라서 M1에서 손님 콘텐츠를 확장하지 않는다.
먼저 현재 판매 화면/테스트가 이 v1을 정확히 표시하도록 복구한다.

---

## 2-9. Growth / Save / Offline

### 상태: `ALREADY IMPLEMENTED — DO NOT REBUILD`

과거 roadmap과 달리 현재 저장소에는 이미 다음이 있다.

- account level
- mission
- standard recipe unlock/purchase
- time-shop recipe unlock/purchase
- material inventory/shop
- cafe upgrades
- beverage codex
- save import/export/reset debug path
- offline reward
- pending puzzle reward claim
- cosmetics/puzzle skins

### Save

메인 save:

- key: `coffee-2048-save-v2`
- schema version: `5`

고객 save:

- key: `coffee2048_customers_v1`
- version: `6`
- migration 존재

### 판단

새 save 시스템을 만드는 작업은 불필요하다.
M1에서는 현재 schema/migration 회귀만 검증한다.

---

# 3. Asset Inventory

## 3-1. REUSE 확정

### 기존 원본 음료 PNG

`image/drink/`에 확인된 자산:

- 꿀 라떼
- 아메리카노
- 아이스 카페라떼
- 아이스아메리카노
- 아포가토
- 카라멜 마키아토
- 카페라떼
- 헤이즐넛 라떼
- 하트

### Runtime optimized drinks

현재 실제 코드에서 사용 확인:

- 아메리카노.webp
- 카페라떼.webp
- 아포가토.webp

### UI / Scene asset groups

`public/assets/`:

- lobby
- roasting
- drinkstation
- counter/reference
- collection

`public/images/`:

- brand
- drink
- ingame
- lobby
- optimized
- ui

Lobby / Roasting / Drinkstation은 실제 대규모 이미지 세트를 가지고 있다.

---

## 3-2. POLISH / REPLACE 후보

신규 이미지가 무조건 필요한 것은 아니다.

다음 조건일 때만 신규 생성/교체를 허용한다.

- 기존 asset이 새 로비의 상업적 품질과 명확히 맞지 않음
- 해상도/가독성 문제
- 동일 메뉴인데 화면별 스타일이 크게 다름
- 새 화면에 필요한 핵심 메뉴가 기존 asset에 없음
- CSS placeholder보다 실제 일러스트가 제품 품질을 크게 높임

특히 Counter는 현재 reference 이미지 폴더는 존재하지만 코드가 선언한 다수의 세부 UI asset 경로는 실제 runtime 이미지로 사용되지 않고 CSS 기반 shell이 상당 부분을 차지한다.
M2에서 시각 품질 비교 후 필요하면 신규 생성/적용한다.

---

## 3-3. LEGACY

기존 `image/**`, mock/reference, 과거 title/UI 자산은 M0에서 삭제하지 않는다.

사용 여부가 불명확한 원본은 신규 이미지 품질 검수/회귀 비교에 사용할 수 있으므로 보존한다.

---

## 3-4. 실제 신규 필요

M0 시점에는 파일명만 보고 대량 신규 제작을 확정하지 않는다.

M1 source-of-truth 정렬 후 M2 visual audit에서 화면별로 `REUSE / POLISH / REPLACE / LEGACY / NEEDED`를 다시 판정한다.

---

# 4. UI/UX 문제

## BLOCKER

### B1. Source-of-truth 이중화

최신 Workbench/Counter/Roaster가 보여주는 상태/선택 중 일부가 실제 domain model과 의미가 다르다.

이 상태에서는 UI가 예뻐져도 플레이어가 보는 규칙과 실제 계산 규칙이 달라질 수 있다.

**M1 최우선.**

---

## HIGH

### H1. Playwright 기능 테스트가 현재 화면 계약과 불일치

현재 CI 실패 중:

- customer sale flow: `판매 중지` 버튼 기대
- customer persistence: `오늘의 손님 · 소연` 단일 문구 기대
- recipe ownership: 도감 카드에 `구매` 문구 기대

실제 현재 화면 확인 결과:

- 계산대는 `판매 중` 상태 UI를 사용
- featured customer는 `오늘의 손님` + `소연 방문 예정`으로 분리
- `/codex`는 수집/제작 단계 도감으로 변경되어 `구매`가 source-of-truth가 아님

따라서 우선은 regression test drift로 판정한다.
다만 테스트를 새 UI에 맞춰 수정한 뒤 실제 persisted state assertion이 끝까지 통과하는지 재검증해야 한다.

### H2. `/lobby/shop`이 임시 화면

현재 로비의 상점 카드가 실제 기능성 shop으로 연결되지만 화면 자체가 `(임시 화면)`이라고 표시된다.
코어 로비의 높은 비주얼과 톤 차이가 크다.

M1의 correctness 대상은 아니며 M2 visual cohesion 우선 대상이다.

---

## MEDIUM

### M1. Lobby onboarding / PLAY overlap 가능성

모바일 screenshot 기준 onboarding 안내가 PLAY 영역을 가리는 구간이 있다.

### M2. Codex는 총 80개 collection fantasy를 제시하지만 실제 현재 beverage 정의와 시각 자산 커버리지가 제한적

확장 콘텐츠를 즉시 80개 만드는 것이 아니라 1.0 실콘텐츠 수와 UI 표현을 정렬해야 한다.

### M3. Roaster의 원두/배전 선택은 현재 mechanics보다 의미가 커 보임

M1에서 의미 정렬, post-1.0에서 실제 깊이 확장 여부 결정.

---

# 5. 검증 결과

현재 GPT-only automation PR에서 기존 GitHub Actions `PR Checks`를 실제 실행했다.

## 성공

- `npm ci`: 성공
- `npm run lint`: **PASS**
- `npm run typecheck`: **PASS**
- `npm run build`: **PASS**
- Next.js static production build: **PASS**
- 17 static app pages 생성: 성공

## Playwright

총 68 tests 실행 구성.

현재 결과:

- PASS: 34
- FAIL: 11
- SKIP: 1
- 미실행: 22 (serial suite가 앞선 실패로 중단되어 후속 테스트가 실행되지 않은 영향)

### 실패 분류

#### Snapshot baseline 미존재: 5건

- lobby desktop
- lobby mobile
- lobby bottom tiles mobile
- puzzle desktop
- puzzle mobile

Linux baseline이 없어 actual screenshot을 생성하고 실패한 케이스.

#### UI contract drift: 6건

- customer sale flow desktop/mobile
- customer persistence desktop/mobile
- recipe ownership desktop/mobile

### npm dependency audit

`npm ci` 로그에서 현재:

- low: 1
- moderate: 1
- high: 5
- critical: 1

총 8건 vulnerability가 보고된다.

M1에서 `npm audit` 원인을 조사하되 `npm audit fix --force`를 자동 실행하지 않는다.
Breaking upgrade가 필요하면 Decision Gate로 올린다.

### CI maintenance

GitHub Actions runner에서 일부 action의 Node 20 runtime deprecation warning이 있다.
제품 blocker는 아니지만 workflow 유지보수 항목으로 기록한다.

---

# 6. 문서와 실제 코드의 차이

## 6-1. 과거 `08_dev_roadmap.md`

과거 문서는 Phase 4에 성장/저장/업그레이드를 미래 작업으로 두고 있다.

현재 실제 코드에는 이미 상당 부분 구현되어 있다.

따라서 과거 roadmap은 제품 철학 참고용으로 유지하되 실행 roadmap으로 사용하지 않는다.

## 6-2. 인수인계 마스터의 이전 상태

기존 handoff는 퍼즐/로비/판매/손님 meta 이후 성장 구조가 덜 붙은 상태로 기록되어 있다.

현재 repo는 그 이후:

- 성장
- 레시피 ownership
- material
- time shop
- codex
- offline reward
- rewarded claim
- cosmetics

까지 더 진행됐다.

## 6-3. `release_scope_1_0.md`

현재 실제 제품 범위를 판단하는 데 가장 최신에 가까운 문서다.

1.0 포함:

- puzzle
- cafe operation
- account level/mission
- recipe/material/time shop
- upgrades/codex/save/offline
- guest meta v1
- rewarded ad 2종

1.0 제외:

- order system
- special beans
- expanded guest meta
- season/event
- broader BM

자동개발 roadmap은 이 경계를 우선한다.

## 6-4. Figma/UI swap 문서

기존 문서는 현재 UI를 functional shell로 보고 기능 source/test id를 유지한 채 비주얼을 교체하는 전략을 세웠다.

실제 repo에서는 lobby 등 일부 1차 외형 교체가 이미 완료됐지만, 새 화면과 domain source의 정렬 작업이 완전히 끝나지 않았다.

---

# 7. 리스크

## R1. '예쁜 가짜 기능' 리스크 — HIGH

화면에서 선택 가능한 것이 실제 결과에 영향을 주지 않으면 게임 신뢰도가 떨어진다.

M1에서 반드시 제거한다.

## R2. Save schema 무분별 확장 — HIGH

Counter의 선택 메뉴를 실제 offline/auto-sale mechanics로 확장하려면 persisted state와 offline settlement까지 영향이 갈 수 있다.

M1에서는 새 mechanics 추가보다 기존 mechanics에 UI를 맞추는 방식을 기본으로 한다.

## R3. 테스트를 단순 삭제해서 녹색으로 만드는 위험 — HIGH

기존 테스트가 stale이더라도 persistence/ownership 보장을 포기하면 안 된다.

UI selector만 현재 화면에 맞추고, 실제 저장 상태/경제 상태 assertion은 유지한다.

## R4. Asset 대량 재생성 — MEDIUM

이미 높은 품질의 lobby/drink assets가 존재한다.
신규 이미지는 품질 향상이 명확한 화면에만 사용한다.

## R5. dependency vulnerabilities — MEDIUM/HIGH

critical 1건이 포함되어 있으므로 M1에서 패키지 원인을 확인해야 한다.
Breaking update는 별도 승인.

---

# 8. 확정된 다음 마일스톤

## M1 — 1.0 기준선 복구 및 Source-of-Truth 정렬

### 목표

**새 콘텐츠를 만들기 전에 현재 존재하는 1.0 기능을 최신 UI에서 정직하게 작동시키고 CI를 녹색으로 만든다.**

### Scope A — UI ↔ Domain 정렬

1. Workbench
   - 하드코딩 recipe/material preview 제거 또는 domain adapter로 전환
   - `visibleMenuOrder`, actual ownership, actual inventory, `validateCraftDrink`, `craftDrink`를 source of truth로 사용
   - 화면에 보이는 제작 가능/불가가 실제 action 결과와 동일해야 함

2. Counter
   - 현재 auto-selling mechanics와 화면 의미 정렬
   - local `selectedDrinkIds`가 실제 mechanics에 영향이 없다면 기능처럼 보이지 않게 정리
   - 신규 sale-filter/save system은 M1에서 만들지 않음
   - featured customer/queue/progress/status를 실제 store 기준으로 표시

3. Roaster
   - 현재 `roastOnce()` source를 유지
   - 원두/배전 선택이 실제 다른 결과를 주는 것처럼 오해시키지 않도록 정렬
   - 특별 원두/배전 mechanics 추가는 1.0 이후

### Scope B — Regression test 복구

- current Counter selling state에 맞게 customer sale-flow selector 수정
- featured customer의 새 카피 구조에 맞게 persistence test 수정
- `/codex`를 collection semantics로 검증하고 recipe ownership의 실제 source는 shop/cafe state로 검증
- persistence assertion은 삭제하지 않음
- Linux screenshot baseline 전략 정리 및 lobby/puzzle baseline 추가

### Scope C — 1.0 Core Smoke

다음 흐름을 desktop/mobile에서 검증:

`puzzle → reward claim → lobby → roast → craft → sale → coin/customer update → reload`

### Scope D — Dependency / CI hygiene

- npm audit 원인 확인
- safe non-breaking update만 자동 적용 가능
- breaking change 필요 시 Decision Gate
- Actions Node runtime warning 검토

### Scope E — 작은 UX blocker

M1의 logic 정렬 과정에서 발견되는 명백한 blocker만 수정.
대규모 visual redesign은 M2로 넘긴다.

### M1 완료 조건

- lint PASS
- typecheck PASS
- build PASS
- desktop/mobile 핵심 Playwright suite PASS
- snapshot baseline 정상
- UI가 실제 source of truth와 의미상 일치
- save migration 깨지지 않음
- 사용자가 로컬에서 core loop를 직접 검수할 수 있는 상태

---

## M2 — Core UI/UX + Asset Quality Pass

M1 이후.

목표:

- 로비/로스터/워크벤치/카운터/상점/도감 간 비주얼 톤 통일
- mobile onboarding/PLAY overlap 개선
- 임시 `/lobby/shop` 외형 교체
- 기존 drink/UI asset 전수 품질 판정
- 필요한 경우 GPT 이미지 생성으로 실제 교체
- 기존 asset보다 품질 이득이 없으면 재사용

M2에서는 mechanics를 새로 확장하지 않는다.

---

## M3 — 1.0 Release Candidate

M2 이후.

목표:

- 전체 1.0 범위 full regression
- save/reload/offline/ad fallback QA
- release scope 밖 surface 노출 점검
- performance/mobile/accessibility
- 배포 환경 검수

M3가 끝난 뒤에만 post-1.0 콘텐츠 확장을 권장한다.

---

## Post-1.0 후보

우선순위는 별도 승인 후 결정:

- 핵심 손님 관계/스토리 심화
- 특별 원두
- 주문 시스템
- 꾸미기
- 이벤트/시즌
- 확장 BM

---

# 9. 추천 첫 자동개발 범위

## 확정 추천: `M1만 먼저 진행`

이유:

1. 현재 기능량이 이미 많다.
2. M1을 건너뛰고 새 콘텐츠를 추가하면 새 UI와 domain drift가 더 커진다.
3. CI가 완전 녹색이 아니므로 자동개발의 안전망을 먼저 복구해야 한다.
4. M1 이후부터 UI/이미지 퀄리티 작업을 더 공격적으로 진행해도 회귀를 빠르게 잡을 수 있다.

M1은 콘텐츠 추가 마일스톤이 아니라 **자동개발 가능한 코드베이스로 만드는 기준선 복구 마일스톤**이다.

---

# 10. 사용자 직접 확인이 필요한 것

M1 완료 후 사용자는 아래만 직접 플레이 검수하면 된다.

1. 퍼즐 스와이프/합체 손맛
2. 퍼즐 종료 보상이 이해되는지
3. 로비에서 다음 행동이 바로 보이는지
4. 로스팅 화면이 실제로 무엇을 하는지 오해가 없는지
5. 음료 제작 가능/불가 상태가 직관적인지
6. 판매 화면이 실제 규칙과 일치한다고 느껴지는지
7. 판매 후 코인/손님 변화가 체감되는지
8. 새로고침 후 상태가 자연스럽게 유지되는지

그 외 lint/typecheck/build/회귀 검사는 GPT + GitHub Actions가 담당한다.

---

# M0 최종 판정

Coffee 2048은 **다시 만드는 프로젝트가 아니다.**

현재 가장 중요한 작업은 기능 확장이 아니라:

> **이미 만들어진 상당한 게임 로직과 최근 만든 고품질 UI를 하나의 source of truth로 다시 결합하고, 자동 테스트 기준선을 회복하는 것**

이다.

M0 완료.
