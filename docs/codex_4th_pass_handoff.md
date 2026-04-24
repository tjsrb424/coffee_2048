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

## 0-1. 이번 세션 추가 반영 사항

이번 세션에서 현재 상태 기준으로 추가 반영된 파일은 아래다.

### 0-1-a. 최신 BM 최소 구현 반영 파일
- `src/app/layout.tsx`
- `src/lib/ads/rewardedAds.ts`
- `src/stores/useAppStore.ts`
- `src/features/meta/types/gameState.ts`
- `src/features/meta/storage/storageKeys.ts`
- `src/features/lobby/components/OfflineSalesCard.tsx`
- `src/features/puzzle2048/components/PuzzleScreen.tsx`
- `src/features/puzzle2048/components/SessionResultModal.tsx`
- `src/components/dev/DevDebugPanel.tsx`
- `locale/messages/ko.ts`
- `tests/visual/rewarded-ad-claims.spec.ts`
- `tests/visual/web-gpt-rewarded.spec.ts`
- `tests/visual/ownershipTestUtils.ts`
- `docs/release_scope_1_0.md`
- `docs/gam_web_rewarded_setup.md`
- `docs/codex_4th_pass_handoff.md`
- `prompts/next_cursor_task.md`

- `src/features/lobby/components/LobbyScreen.tsx`
- `src/features/settings/components/SettingsHubScreen.tsx`
- `src/features/shop/components/ShopPlaceholderScreen.tsx`
- `src/features/extension/components/ExtensionHubScreen.tsx`
- `src/features/extension/components/LiveOpsPlaceholderSection.tsx`
- `docs/figma_ui_swap_plan.md`
- `docs/release_scope_1_0.md`
- `docs/09_cursor_workflow.md`
- `src/features/meta/progression/levelBands.ts`
- `src/features/meta/content/timeShop.ts`
- `src/features/lobby/components/AccountLevelCard.tsx`
- `src/features/lobby/components/CafeShopSection.tsx`
- `src/features/timeShop/components/TimeShopScreen.tsx`
- `locale/messages/ko.ts`
- `src/features/meta/progression/missionDefinitions.ts`
- `src/features/meta/economy/recipes.ts`
- `src/features/meta/economy/materials.ts`
- `src/features/meta/balance/cafeModifiers.ts`
- `src/features/meta/rewards/offlineCafeReward.ts`
- `tests/visual/recipe-ownership.spec.ts`
- `tests/visual/core-loop.spec.ts`
- `docs/codex_4th_pass_handoff.md`
- `prompts/next_cursor_task.md`

핵심 반영 내용:
- 이번 세션에서는 1.0 최소 BM 실구현으로 `오프라인 보상 x2`, `퍼즐 결과 x2` 2개만 실제 동작하도록 연결했다.
- 광고 보상은 실제 SDK에 직접 묶지 않고 `src/lib/ads/rewardedAds.ts`의 작은 adapter(`requestRewardedAd(placement)`) 뒤로 숨겼다.
- 현재 adapter는 `mock`, `web-gpt-rewarded`, `unsupported fallback`을 분기하고 placement는 `offline_reward_double`, `puzzle_result_double` 두 개만 지원한다.
- web 1.0 실제 provider 1차는 `Google Publisher Tag + Google Ad Manager rewarded` 기준으로 연결했다.
- 실제 ad unit path는 하드코딩하지 않고 `NEXT_PUBLIC_REWARDED_AD_PROVIDER`, `NEXT_PUBLIC_GAM_REWARDED_OFFLINE_AD_UNIT_PATH`, `NEXT_PUBLIC_GAM_REWARDED_PUZZLE_AD_UNIT_PATH`, `NEXT_PUBLIC_GAM_REWARDED_SCRIPT_URL`, `NEXT_PUBLIC_REWARDED_AD_REQUEST_TIMEOUT_MS`로 주입한다.
- 오프라인 보상 x2는 `OfflineSalesCard`의 pending claim에 `claimId`를 붙여 `보상 받기` / `광고 보고 2배`를 분리했고, claim 완료 시 pending을 즉시 비워 중복 수령과 새로고침 중복을 막는다.
- 퍼즐 결과는 persisted `pendingPuzzleRewardClaim`을 추가해 결과 모달 claim을 저장 기준으로 다루도록 바꿨다. 새로고침 뒤에도 pending claim이 남아 있으면 다시 결과 모달을 열 수 있다.
- 퍼즐 결과 x2는 **코인 + 원두만** 2배로 처리하고, 하트 / 미션 / 손님 / 도감 / 해금 / 시간대 메타 진척은 배수하지 않는다.
- 퍼즐 결과 claim 시 `puzzleProgress.lastRunCoins/Beans`는 실제 지급량을 기록하지만, mission event에는 base reward만 전달해 미션 진행도가 광고 배수로 늘어나지 않게 고정했다.
- adapter 결과 상태는 `rewarded`, `cancelled`, `error`, `no_fill`, `unsupported`를 구분하고, UI는 provider 종류를 모른 채 notice만 분기한다.
- web rewarded가 지원되지 않거나 fill이 없으면 claim은 진행하지 않고 pending을 유지한 채 기본 보상 경로로 되돌린다.
- `src/lib/ads/rewardedAds.ts`에는 placement별 `getRewardedAdAvailability()` helper를 추가해, config상 이미 `unsupported`이거나 같은 placement에서 `unsupported`가 한 번 확인된 뒤에는 UI가 광고 CTA를 계속 적극 노출하지 않도록 정리했다.
- 현재 웹 테스트 환경에서는 provider를 `web-gpt-rewarded`로 강제해도 최종 결과가 `web-gpt-rewarded:unsupported`로 끝날 수 있으며, 이는 정상적인 지원 불가 케이스로 취급한다.
- 이번 세션에서는 루트 viewport를 `width=device-width, initial-scale=1, viewport-fit=cover` 중심의 중립 형태로 정리하고, reward web 예시와 충돌 가능성이 있던 `maximum-scale=1`을 제거했다.
- `src/lib/ads/rewardedAds.ts`는 이제 `defineOutOfPageSlot(..., REWARDED)`가 `null`일 때 단순 heuristic 후보만 남기지 않고, 실제 호출 시점의 `path`, `top-level window`, `document.readyState`, `visibilityState`, `focus`, `GPT script tag`, `window.googletag`, `apiReady`, `pubadsReady`, rewarded enum, `slotReturnedNull`을 detail/debug에 함께 남긴다.
- `getRewardedAdAvailability()`는 `last unsupported` 결과만으로 CTA를 영구 비활성화하지 않게 바꿨다. config가 살아 있으면 재시도를 허용하고, 마지막 unsupported는 진단 힌트로만 남긴다.
- `src/components/dev/DevDebugPanel.tsx`에서는 현재 page diagnostics, 현재 GPT 상태, 마지막 광고 시도의 structured debug(`slotReturnedNull`, notes, request path/ad unit`)를 함께 볼 수 있다.
- production 배포판에서는 풀 `DevDebugPanel`을 다시 열지 않고, `?ad_debug=1`일 때만 `ReadOnlyAdDebugPanel`이 뜨도록 분리했다.
- `ReadOnlyAdDebugPanel`은 rewarded 진단값만 읽을 수 있는 read-only 패널이며, 현재 provider/resolved provider, 마지막 광고 시도 결과, `slotReturnedNull`, secure/mobile/touch, top-level, viewport meta, GPT 상태, request/slot 시점 진단만 보여준다.
- 재화 수정 / 세이브 조작 / mock 결과 변경 / provider override는 배포판에서 노출하지 않는다.
- 최신 패스에서는 `gpt.js` 로더 진단도 강화했다. 이제 script append/reuse, append target, DOM tag 존재, `onload`/`onerror`/`timeout`, script src, timeout ms, CSP hint를 structured debug로 남긴다.
- 이번 기준으로 timeout 진단은 `script load -> GPT bootstrap/services init -> rewarded slot creation` 3단계로 분리된다.
- `web-gpt-rewarded:timeout`이 나면 이제 `scriptLoaded`, `bootstrapStarted`, `bootstrapCompleted`, `servicesEnableAttempted`, `servicesEnabledByApp`, `slotAttempted`, `slotReturnedNull`로 실제 정지 지점을 더 직접적으로 확인할 수 있다.
- 실제 모바일 배포에서 드러난 핵심 원인은 `googletag.apiReady === true` 이후에도 `cmd` 배열이 없으면 bootstrap 완료를 막아 버린 점이었다. GPT 실객체는 이미 `pubads()/enableServices()/defineOutOfPageSlot()/display()`를 제공하고 있었는데, 코드가 `cmd` 부재를 fatal로 해석해서 `bootstrap_cmd_missing`에서 멈췄다.
- 같은 구간에서 `ensureWindowGoogletagShell()`가 `cmd`만 남기고 기존 `googletag` 객체를 덮어쓸 위험도 있었다. 지금은 기존 GPT 메서드를 유지한 채 `cmd`만 보강하고, bootstrap 완료 조건은 `apiReady + 필수 API surface` 기준으로 안정화했다.
- `ReadOnlyAdDebugPanel`에는 `cmd length`와 `servicesEnableError`도 노출해, 다음 이슈에서는 `cmd` 부재가 실제 blocker인지 단순 신호인지 바로 구분할 수 있다.
- 안정화용으로 `preloadRewardedAdRuntime()`를 추가했고, 현재는 `PuzzleScreen`과 `OfflineSalesCard` surface mount 시점에서만 얇게 preload한다.
- page/GPT 상태가 정상인데도 모바일에서 계속 `slotReturnedNull=true`면, 코드/페이지보다는 GAM의 `Block non-instream video ads` 보호, rewarded ad unit/line item 연결, 실제 브라우저/웹뷰 지원 범위 쪽 근거가 더 강해진다.
- `SessionResultModal`과 `OfflineSalesCard`는 같은 정책을 따른다. 즉 광고 가능 환경에서는 기존 x2 CTA를 유지하고, `unsupported` 환경에서는 짧은 안내 문구 + 비활성화 CTA로 정리한다.
- 일반 유저용 notice에서는 `provider:status` 꼬리를 제거했고, 원인 식별은 `DevDebugPanel`의 마지막 광고 시도/세부 detail로 유지한다.
- dev/debug 경로에서는 provider override(`mock / web-gpt-rewarded / unsupported / auto`)와 mock 결과(`success / cancel / error / no_fill / unsupported`)를 바꿔 QA할 수 있게 했다.
- `tests/visual/rewarded-ad-claims.spec.ts`를 추가해 아래 2가지를 고정했다.
  - 오프라인 보상: 기본 수령 / 광고 2배 수령이 각각 1회만 가능하고 새로고침 뒤에도 중복 수령되지 않음
  - 퍼즐 결과: 광고 x2에서 코인 / 원두만 차이 나고 다른 메타 진척은 동일함
- `tests/visual/web-gpt-rewarded.spec.ts`를 추가해 fake `googletag`로 web provider 경로의 success / cancelled / no_fill / unsupported fallback을 고정했다.
- 같은 테스트 파일에 `apiReady=true`지만 `cmd`가 없는 fake GPT 케이스도 추가해, bootstrap이 더 이상 `bootstrap_cmd_missing`에서 멈추지 않고 `servicesEnabledByApp=true`, `slotAttempted=true`까지 진행되는 회귀를 고정했다.
- 이번 세션에서는 1.0 범위 밖인 `/shop`, `pass/liveOps`, placeholder BM 표면이 일반 유저에게 1.0 기능처럼 보이지 않도록 노출 정책을 실제 UI에 반영했다.
- 로비 상단 메뉴와 설정 화면에서 `/shop` 직접 진입을 제거하고, `/shop` route 자체는 QA/direct route 용 **비출시 데모 보관함**으로만 남겼다.
- `/shop` 화면은 `오프라인 보상 x2`, `퍼즐 결과 x2(코인+원두만)`만 1.0 BM 범위라는 점을 명시하고, 광고 제거 / 스타터 팩 / 테마 / 꾸미기 표면은 `출시 후 예정`으로 비활성화했다.
- `/extension` 화면은 1.0 포함 기능인 설비 업그레이드를 먼저 보이게 두고, `pass/liveOps`, 특별 손님 확장, 시즌 이벤트는 **출시 후 예정 메모** 레이어로 낮췄다.
- 이번 세션에서는 현재 UI를 최종 비주얼이 아닌 **기능 셸(functional shell)** 로 정의하고, 이후 Figma 기준 전체 UI 교체를 쉽게 하기 위한 `docs/figma_ui_swap_plan.md`를 추가했다.
- 문서에서 `기능 셸로 유지할 영역`, `Figma 교체 예정 영역`, `교체 시 깨질 위험이 있는 결합 포인트`, `지금 미리 분리해두면 좋은 컴포넌트`, `유지해야 할 test id / QA 포인트`를 분리해 정리했다.
- 현재 로비/바텀시트/HUD/상점/time-shop UI는 기능 구현과 QA를 우선하는 셸로 보고, spacing/padding/polish 과투자를 피한다는 전제를 handoff 문서에도 반영했다.
- 이번 세션에서는 `docs/release_scope_1_0.md`를 추가해, 현재 레포 기준 1.0 출시선을 문서로 고정했다.
- `docs/09_cursor_workflow.md`의 오래된 경로 예시(`07_roadmap`, `next_task`, `changelog`)는 실제 레포 기준 파일명 중심으로 정리했다.
- 1.0 포함 범위는 `퍼즐 코어 / 카페 운영 루프 / 성장 메타 / 손님 메타 v1 / 오프라인 보상 1차`로 정리했고, 주문 시스템 / 특별 원두 / 확장형 손님 메타 / 시즌 구조는 1.1 이후로 넘기도록 못 박았다.
- 1.0 BM은 **보상형 광고 2종만** 포함한다. 즉 `오프라인 보상 x2`, `퍼즐 결과 x2`만 열어 두고, 퍼즐 결과 x2는 `코인 + 원두`에만 적용하며 미션/도감/손님/해금 진척은 배수 대상에서 제외한다.
- `테마 스킨`, `이펙트 스킨`, `pass/liveOps`, 실결제 확장은 1.1 후보로 문서상 분리했다.
- 성장 구조 밸런스 2차로 초반(1~20) 미션 목표치를 낮추고, 라떼/아포가토 구매 가격과 업그레이드 첫 진입 비용을 함께 낮춰 초반 성장이 더 빨리 붙도록 조정했다.
- 중반(20~50) 선택지 부족을 줄이기 위해 시간대 메뉴 해금 구간을 `18~48`로 재배치했다. 이제 시간대 레시피가 60대 이후에 몰리지 않고 중반 레벨 구간에 분산된다.
- 이번 세션에서는 그 중반 해금이 실제로 보이도록, 성장 카드의 `다음 해금 preview`, 로비 상점 시트의 `떠돌이 판매상 한 줄 힌트`, 시간대 상점 카드의 `새로 열림 / 지금 추천 / 다음에 열림` 배지를 최소 범위로 추가했다.
- `LEVEL_UNLOCKS`에 시간대 상점 해금 레벨을 함께 합쳐, 별도 팝업 없이도 `Lv.20 / 22 / 31 / 48` 전후에 다음 한정 메뉴를 성장 카드에서 자연스럽게 확인할 수 있게 정리했다.
- 로비 상점 시트는 현재 시간대 기준으로 `지금 나와 있는 한정 노트` 또는 `곧 열릴 다음 한정 노트`를 한 줄로 보여주고, 바로 `떠돌이 판매상`으로 넘어갈 수 있게 연결했다.
- `tests/visual/recipe-ownership.spec.ts`에 중반 해금 인지 UX 회귀 2건을 추가해, `AccountLevelCard` preview와 `TimeShopScreen` 추천/신규 배지가 데스크톱 기준으로 다시 깨지지 않도록 고정했다.
- 시간대 메뉴 중 `fruitBase` 계열이 원가 기준 적자였던 문제를 재료 가격 조정으로 해소해, 중반 메뉴가 실제로 코인 수급 선택지가 되도록 정리했다.
- `Lv.31+` 메인 레벨업 미션에서 스킨 구매 / 시간대 레시피 구매 / 스토리 수집처럼 현재 레벨에서 막힐 수 있는 목표를 제거하고, 바로 진척 가능한 판매/제작/매출 목표 중심으로 재구성했다.
- 후반(50+)은 미션 수치 증가율을 완만하게 낮춰 “레벨은 오르는데 해야 할 일만 늘어나는” 감각을 줄였다.
- 오프라인 보상은 전체 경제 완화와 겹쳐 과속하지 않도록 `90분 cap + 50% 정산`으로 소폭 낮췄다.
- `tests/visual/recipe-ownership.spec.ts` 기대값을 새 시간대 레시피 가격에 맞춰 갱신하고 회귀를 다시 통과시켰다.
- 이번 세션에서는 `tests/visual/core-loop.spec.ts`를 추가해, **퍼즐 1판 -> 결과 보상 -> 로비 반영 -> 로스팅/제작/진열/판매 -> 코인 증가 -> 새로고침 유지**가 실제 UI + 저장 write path 기준으로 한 번 닫히는지 Playwright 회귀 1건으로 고정했다.
- 이 테스트는 기존 `ownershipTestUtils.ts`의 디버그 save import/export와 고정 시계를 재사용하고, 퍼즐 쪽은 고정 RNG + 짧은 입력 시퀀스로 최소 득점 경로만 재현하도록 설계했다.
- 최근 로비 Figma 1차 패스에서는 `LobbyScreen`, `ResourceBar`, `AccountLevelCard`에 exported asset을 실제로 입혔다. 적용 범위는 로비 배경, 상단 로고, 메뉴 버튼, 4개 메인 타일, 플레이 버튼, compact HUD bar, 레벨/티어 배지까지이고, 바텀시트/오프라인 카드/`CafeLoopSection` 내부 카드 외형은 아직 기능 셸 상태로 남겨 두었다.
- 이 패스에서도 기존 클릭 액션, `useAppStore`/claim/store 흐름, `data-testid="lobby-reference-tile-*"`와 `data-testid="lobby-reference-tile-grid"`, `aria-label="메뉴 열기"`, `PLAY` 버튼 anchor는 유지했다.

---

## 1. 함께 봐야 하는 기준 문서

Cursor는 이 문서 **하나만 읽으면 안 된다.**
반드시 아래 문서와 **함께** 봐야 한다.

### 1-1. 현재 레포에서 실제로 함께 봐야 하는 방향 문서
- `docs/figma_ui_swap_plan.md`
- `docs/release_scope_1_0.md`
- `docs/gam_web_rewarded_setup.md`
- `prompts/next_cursor_task.md`
- `docs/14_cursor_handoff_update.md`
- `docs/11_lobby_interaction_direction.md`

주의:
- 과거 문서에서 반복 참조하는 `coffee_2048_project_handoff_master.md`는 **현재 레포에 없다**.
- 따라서 현재 작업 방향, 금지사항, 우선순위는 위 방향 문서들을 기준으로 읽는 편이 안전하다.

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
  - `SAVE_SCHEMA_VERSION = 5`
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
- 오프라인 보상 관련 persisted 필드:
  - `meta.lastSeenAtMs`
  - `cafeState.pendingOfflineReward`
  - `cafeState.lastOfflineSaleAtMs`
  - `cafeState.lastOfflineSaleCoins`
  - `cafeState.lastOfflineSaleSoldCount`
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
- [x] save version 존재함 (메인 5 / 손님 6)
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
- [x] 실제 판매 write path 기반 선호 메뉴 보너스(`preferredBonus`) 회귀 테스트 추가 완료 (`tests/visual/customer-sale-flow.spec.ts`)
- [x] 실제 판매 write path 기반 오늘의 손님 daily quota day-boundary reset/rollover 회귀 테스트 추가 완료 (`tests/visual/customer-sale-flow.spec.ts`)
- [x] 다음 날 진입 시 대표 손님 교체(`featuredCustomerId`) 및 persistence 회귀 테스트 추가 완료 (`tests/visual/customer-sale-flow.spec.ts`)
- [x] 실제 판매 뒤 카운터 시트 단골 흔적/팁 ping 최소 UI 회귀 테스트 추가 완료 (`tests/visual/customer-sale-flow.spec.ts`)
- [x] 날짜 경계 뒤 비저장 `saleSession` 재생성 및 다음 날 판매 지속 회귀 테스트 추가 완료 (`tests/visual/customer-sale-flow.spec.ts`)
- [x] 마지막 접속 시각(`meta.lastSeenAtMs`) 기반 오프라인 보상 1차 구현 완료
- [x] 복귀 시 메인 로비 오프라인 보상 카드 노출 및 수령 흐름 구현 완료
- [x] 오프라인 보상 pending/claim/persistence 회귀 추가 완료 (`tests/visual/meta-persistence.spec.ts`)
- [x] 오프라인 보상 x2 최소 BM 구현 완료: `보상 받기` / `광고 보고 2배` 분리, `claimId` 기반 중복 방지, 새로고침 후 재수령 방지
- [x] 퍼즐 결과 x2 최소 BM 구현 완료: persisted `pendingPuzzleRewardClaim`, `기본 받기` / `광고 보고 코인+원두 x2` 분리, 코인/원두만 2배 적용
- [x] 보상형 광고 adapter를 `mock`에서 실제 web `GPT + GAM rewarded` 경로까지 확장 완료 (`src/lib/ads/rewardedAds.ts`)
- [x] 보상형 광고 provider override + mock/debug 토글 추가 완료 (`src/components/dev/DevDebugPanel.tsx`)
- [x] BM 최소 QA 회귀 추가 완료 (`tests/visual/rewarded-ad-claims.spec.ts`)
- [x] web rewarded provider path 회귀 추가 완료 (`tests/visual/web-gpt-rewarded.spec.ts`)
- [x] `unsupported` 환경 UX 정리 완료: 퍼즐 결과 모달 / 오프라인 보상 카드 모두 광고 CTA를 같은 정책으로 비활성화하고, 기존 `광고 확인 중... -> 다시 버튼` 혼란을 줄이는 안내 흐름으로 정리
- [x] 성장 구조 밸런스 2차 완료: 미션 목표치 / 초반 레시피 가격 / 시간대 메뉴 해금 레벨 / 재료 가격 / 업그레이드 비용 / 오프라인 보상 비율 재조정
- [x] 중반 해금 인지 UX 최소 보강 완료: 성장 카드 다음 해금 preview, 로비 상점의 떠돌이 판매상 한 줄 안내, 시간대 상점의 `새로 열림 / 지금 추천 / 다음에 열림` 배지 추가
- [x] 중반 해금 인지 UX 회귀 추가 완료 (`tests/visual/recipe-ownership.spec.ts`)
- [x] 퍼즐 1판 -> 결과 보상 -> 로비 자원 반영 -> 로스팅/제작/진열/판매 -> 코인 증가 -> 새로고침 유지 핵심 루프 회귀 추가 완료 (`tests/visual/core-loop.spec.ts`)

### 9-2. 미완료 또는 임시 처리 항목
- [x] 현재 UI는 최종 비주얼이 아니라 기능 셸로 간주하고, Figma 기준 전체 교체는 후속 세션에서 진행하기로 문서상 고정했다
- [x] 로비/상점/카운터/쇼케이스/HUD/바텀시트는 외형 교체 대상이지만, route / action / test id / source of truth는 유지 대상으로 분리했다
- [x] `/shop`은 일반 진입점에서 숨기고, direct route에서는 비출시 데모 보관함으로만 남겼다
- [x] `passProgress`, `liveOps`는 저장 슬롯 중심이고 보상 규칙은 후속이며, 현재 UI에서도 출시 후 예정 메모 수준으로만 노출한다
- [x] 1.0 BM 최소 실구현 완료: `오프라인 보상 x2`, `퍼즐 결과 x2(코인+원두만)`이 실제 claim/store/새로고침 기준으로 동작한다
- [x] web 1.0 실제 rewarded ad 연결 1차 완료: `requestRewardedAd(placement)` 뒤에서 `web-gpt-rewarded`와 fallback이 동작한다
- [x] 현재 웹 테스트 환경의 `web-gpt-rewarded:unsupported` 결과를 일반 사용자 UX에서 명확한 실패/비지원 경로로 취급하도록 정리했고, 두 placement 모두 동일 정책으로 노출한다
- [x] `테마 스킨`, `이펙트 스킨`은 1.0 포함 기능이 아니라 1.1 후보로 문서상 분리했다
- [x] 시간대 레시피 구매 ownership은 여전히 `beverageCodex.purchasedTimeRecipeIds`에 별도 저장됨
- [x] 레벨/미션/스킨/손님 저장 persistence baseline은 `tests/visual/meta-persistence.spec.ts`로 고정됐음
- [x] 손님 판매 write path baseline은 `tests/visual/customer-sale-flow.spec.ts`로 고정됐고, 선호 보너스 / daily quota day-boundary / 대표 손님 교체 / 단골 흔적 UI / `saleSession` 날짜 경계 재생성까지 포함됨. 다만 day-boundary UI 결합 회귀는 아직 얇음
- [x] 1.0 핵심 운영 루프 baseline은 `tests/visual/core-loop.spec.ts`로 한 번 더 고정됐고, 퍼즐 보상 적용 뒤 실제 로스터/제작/진열/판매를 거쳐 새로고침 후에도 `playerResources`, `puzzleProgress`, `accountLevel`, `beverageCodex`, `menuStock`이 유지되는지 확인함
- [x] 시간대 판정은 로컬 시간 하드코딩 기준
- [x] `coffee_2048_project_handoff_master.md` 참조는 남아 있지만 실제 파일은 레포에 없음
- [x] 오프라인 보상은 아직 1차 단순 버전이라 `진열 중인 재고 판매 + 부분 코인 정산`까지만 다루고, 생산/주문/손님 메타 복합 시뮬레이션은 의도적으로 비웠음
- [x] 밸런스 2차는 수치 패스 중심이라, 실제 장기 retention 데이터 없이 휴리스틱 기준으로 조정한 상태다

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
- `STORAGE_KEY` 문자열은 `v2`인데 실제 schema version은 `5`라 이름상 혼선이 있음

### 10-2. 상태 source of truth 중복
- 표준 레시피는 `accountLevel`, 시간대 레시피는 `beverageCodex.purchasedTimeRecipeIds`에 저장되어 기준이 분리돼 있음
- 제작/판매/상점/도감 조회는 `recipeOwnership.ts` helper로 정리됐지만, write path 자체는 여전히 store 내 다른 필드에 남아 있어 후속 확장 시 저장 구조 통합 여부를 별도 결정해야 함

### 10-3. 시간대 상점 하드코딩
- 로컬 시간 기준이 지나치게 하드코딩되어 있으면 테스트/확장 시 불편함
- 현재 ownership 회귀 테스트는 브라우저 시간 mocking으로 고정됐지만, 다른 시간대 메타 조합까지 한 번에 다루는 공용 테스트 유틸은 아직 얇다

### 10-4. placeholder 구조의 오해
- `/shop`은 실결제/BM 구현이 아니라 direct route 기준 비출시 데모 보관함이다
- `passProgress`, `liveOps`는 저장/표시 중심이며 실제 시즌 보상 구조가 아직 닫히지 않았다
- 따라서 1.0 출시선 문서에서는 BM을 `/shop` 기준으로 읽지 않고, `오프라인 보상 x2`와 `퍼즐 결과 x2(코인+원두만)`만 출시선에 포함된다고 명시했다

### 10-5. 손님 최소 연결 훅의 실사용 부재
- 손님 훅은 애정도/스토리/단골 판정/선호 보너스/daily quota day-boundary/대표 손님 교체 write path와 단골 흔적 UI 노출, 비저장 `saleSession` 날짜 경계 재생성까지 회귀가 고정됐다
- 다만 day-boundary 복합 UI 일관성은 아직 얇다
- 주문 시스템/특별 원두/대형 보상 구조와는 아직 분리돼 있다

### 10-6. 오프라인 보상 1차의 한계
- 현재 오프라인 보상은 `진열 재고`만 줄이며, 로스팅/제작/재료 구매까지는 자동 시뮬레이션하지 않는다
- `pendingOfflineReward`가 떠 있는 동안 추가 오프라인 누적을 합산하지는 않는다. 먼저 받아서 비우는 흐름을 전제로 한 1차 설계다
- 손님 애정도/스토리/도감 판매 카운트는 오프라인 보상에서 직접 올리지 않는다. 기존 판매 write path와 충돌을 줄이기 위한 의도적인 제한이다

### 10-7. 밸런스 2차 이후 남는 리스크
- 시간대 메뉴 해금을 중반으로 당겼기 때문에, 실제 플레이에서 시간대 창 접근 빈도가 충분한지 별도 UX 확인이 필요하다
- 미션 목표는 현재 “막히지 않게”를 우선한 값이라, 후속 세션에서는 지나치게 쉬워진 구간이 없는지 다시 봐야 한다
- 스킨 가격/상점 소비는 이번 패스에서 건드리지 않았기 때문에, 코인 여유가 늘어난 뒤에는 퍼즐 스킨 쪽 체감도 따로 확인해야 한다
- 현재 UI는 기능 셸과 최종 비주얼이 일부 컴포넌트 안에서 섞여 있어, Figma 교체 시 `useAppStore` 직접 참조 / 텍스트 기반 테스트 / 하드코딩된 일러스트 패딩이 결합 포인트가 될 수 있다
- 이번 세션의 안내는 의도적으로 얇은 카드/배지 레이어만 추가한 상태라, 성장 카드를 열지 않는 유저에게도 `다음 해금`이 충분히 보이는지는 실제 플레이 감각을 한 번 더 볼 필요가 있다
- Playwright 타깃 회귀는 데스크톱 기준으로 통과했지만, 모바일 프로젝트에서는 간헐적인 `webServer` 접속 거절 플래키가 한 번 관측돼 CI 환경에서는 분리 확인이 필요하다

### 10-8. web rewarded ad ops 리스크
- 현재 레포는 GPT + GAM rewarded 연결 구조와 fallback 정책까지 닫혔지만, 실제 fill rate와 수익화는 ad unit / line item / inventory 설정 품질에 크게 좌우된다
- web rewarded는 지원 환경 제약이 있어 일부 브라우저/기기에서는 `unsupported`가 정상 동작일 수 있다
- 현재 코드에서 page-level 대표 점검 포인트는 `src/app/layout.tsx` viewport와 `DevDebugPanel` page diagnostics다. 여기서 neutral viewport / mobile heuristic / secure context가 맞는데도 `defineOutOfPageSlot(..., REWARDED)`가 계속 `null`이면, 그 다음은 실제 브라우저/기기 조합 또는 GAM 지원 범위를 의심하는 편이 맞다
- 1.1에서 앱 패키징 + 모바일 SDK로 갈 때는 provider만 교체하면 되지만, claim/store 정책과 placement 2개는 유지하는 편이 안전하다

---

## 11. Cursor가 다음으로 추천받아야 하는 작업 우선순위

이번 문서를 읽은 뒤 Cursor는 보통 아래 순서로 이어가는 것이 좋다.

### 1순위
1.0 출시 전 핵심 QA 고정: `docs/release_scope_1_0.md` 기준으로 퍼즐 -> 카페 -> 성장 -> 저장 -> 손님 메타 v1 루프가 흔들리지 않도록 필수 회귀를 묶기

### 2순위
1.0 제외 표면 정리: `/shop`, `pass/liveOps`, placeholder BM 문구가 실제 출시 기능처럼 읽히지 않도록 노출 기준과 문구를 정리

### 3순위
Figma 교체 전 셸 분리: `docs/figma_ui_swap_plan.md` 기준으로 HUD / 바텀시트 / 로비 패널의 상태와 표현을 더 안전하게 분리하고, test id와 QA 앵커를 유지한 채 교체 포인트를 정리

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
- docs/figma_ui_swap_plan.md
- docs/release_scope_1_0.md
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
- 실제 작업 기준은 `docs/figma_ui_swap_plan.md`, `docs/release_scope_1_0.md`, `docs/gam_web_rewarded_setup.md`, `prompts/next_cursor_task.md`, `docs/14_cursor_handoff_update.md`, `docs/11_lobby_interaction_direction.md`, 그리고 이 문서다.

이번 단계의 핵심은,

**손님 메타를 더 크게 벌리기 전에, 성장 구조 / 저장 / 스킨 / 도감 / 상점 구조를 실제 플레이 가능한 장기 루프로 닫는 것**

이었다.

Cursor는 다음부터 이 문서를 기준으로,
"무엇을 새로 만들지"보다 먼저
"이미 무엇이 구현되었고 무엇이 아직 비어 있는지"
를 확인하고 이어서 작업해야 한다.
