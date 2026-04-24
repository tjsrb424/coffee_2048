# Next Cursor Task

## 이번 세션 목표

**`docs/release_scope_1_0.md`로 1.0 출시선이 고정되고, `오프라인 보상 x2` / `퍼즐 결과 x2(코인+원두만)` 최소 BM과 web 1.0용 `GPT + GAM rewarded` adapter 경로까지 실제 구현된 현재 상태를 기준으로, 다음 세션에서는 BM을 넓히지 말고 1.0 출시 전 필수 QA 또는 ad ops 안정화 1개만 좁게 다룬다.**

추가 전제:

- 현재 UI는 최종 비주얼이 아니라 **기능 셸(functional shell)** 이다
- 이후 Figma 기준으로 로비/상점/카운터/쇼케이스/HUD/바텀시트 전체 교체가 예정돼 있다
- 최근 패스에서 로비 1차는 이미 적용됐다. 즉 배경 / 상단 로고 / 메뉴 버튼 /
  4개 메인 타일 / 플레이 버튼 / compact HUD / 레벨 배지는 exported asset 기준으로 교체됐고,
  남은 범위는 바텀시트 / `CafeLoopSection` 내부 카드 / 오프라인 카드 / 세부 HUD polish 쪽이다
- 따라서 지금은 임시 UI polish보다 **상태와 표현 분리 / source of truth 유지 / test id 유지 / 교체 포인트 명확화**를 우선한다

이번 세션에서는 **새 대형 시스템을 추가하지 말고**, 먼저 아래를 끝내는 것이 목표다.

1. `docs/codex_4th_pass_handoff.md`
2. `docs/release_scope_1_0.md`
3. `docs/gam_web_rewarded_setup.md`
4. `docs/figma_ui_swap_plan.md`
5. `docs/14_cursor_handoff_update.md`
6. `docs/11_lobby_interaction_direction.md`

위 문서를 기준으로 현재 코드베이스를 분석한다.

그 다음 아래만 수행한다.

- 1.0 출시선 안에 포함된 루프만 다시 확인
- 새 기능 추가 대신 `필수 QA 1건` 또는 `비출시 표면 1건 정리`만 다룸
- 기존 퍼즐/카페/성장/손님 메타 v1 baseline 위에 얇게 추가
- 큰 리라이트 금지
- 새 대형 기능 추가 금지

---

## 왜 이 작업을 먼저 하는가

현재 프로젝트는 이미:

- 2048 퍼즐 코어
- 퍼즐 보상 연결
- 카페 운영 기본 루프
- 손님 최소 메타
- 성장 구조/저장 4차 전달문 범위
- 메타 저장 persistence 회귀
- 손님 판매 write path 회귀
- 오프라인 보상 1차 baseline
- 오프라인 보상 x2 최소 BM 구현 + claim/reload 회귀
- 성장 구조 밸런스 2차
- 중반 해금 인지 UX 최소 보강
- 퍼즐 -> 보상 -> 로비 자원 반영 -> 로스팅/제작/진열/판매 -> 새로고침 유지 핵심 루프 Playwright baseline
- 퍼즐 결과 x2 최소 BM 구현 + `코인 + 원두만` 2배 정책 고정
- `requestRewardedAd(placement)` adapter 뒤에 `mock`, `web-gpt-rewarded`, `unsupported fallback` 분기 도입
- web 1.0용 `GPT + GAM rewarded` 연결 구조 + env/config 주입 경로 반영
- 현재 웹 테스트 환경에서 `web-gpt-rewarded` override가 실제로 `unsupported`로 끝날 수 있는 상태를 확인했고, 퍼즐 결과/오프라인 보상 UI는 이를 명확한 비지원 UX로 정리해 둔 상태
- 루트 viewport는 현재 `width=device-width, initial-scale=1, viewport-fit=cover` 기준으로 정리돼 있고, `unsupported` detail/DevDebugPanel에는 viewport/mobile/secure 후보 원인이 남도록 보강된 상태
- 최근 패스에서는 `defineOutOfPageSlot(..., REWARDED)` 직전/직후의 page/GPT state와 `slotReturnedNull`을 structured debug로 남기고, `last unsupported` 결과만으로 CTA를 미리 잠그지 않도록 완화한 상태
- production 배포판에서는 풀 `DevDebugPanel` 대신 `?ad_debug=1`일 때만 열리는 `ReadOnlyAdDebugPanel`로 광고 진단을 읽을 수 있는 상태
- 최신 상태에서는 `gpt.js` load timeout도 append/reuse/onload/onerror/timeout/CSP hint까지 structured debug로 볼 수 있는 상태
- 최신 상태에서는 timeout 원인을 `script load`, `GPT bootstrap/services init`, `rewarded slot creation` 단계로 나눠 볼 수 있는 상태
- dev/debug provider override + mock outcome 토글
- 1.0 출시선 문서 고정
- `/shop` / `pass` / `liveOps` / placeholder BM 노출 정리

까지 진행된 상태다.

이 시점에서는 새 기능을 다시 크게 벌리기보다,  
**1.0에 넣기로 한 기능만 안정적으로 남기고, 1.1로 넘길 기능은 더 이상 섞이지 않게 정리하는 것**이 우선이다.

문서와 실제 코드가 어긋난 상태에서 다음 기능(핵심손님 확장, 특별 원두, 주문 시스템 등)을 얹으면
중복 구현 / 상태 충돌 / 저장 구조 꼬임이 생기기 쉽다.

---

## 먼저 읽을 문서

우선순위대로 읽어라.

1. `docs/codex_4th_pass_handoff.md`
2. `docs/release_scope_1_0.md`
3. `docs/gam_web_rewarded_setup.md`
4. `docs/figma_ui_swap_plan.md`
5. `docs/14_cursor_handoff_update.md`
6. `docs/11_lobby_interaction_direction.md`
7. `docs/09_cursor_workflow.md`

필요 시 참고:
- `docs/08_dev_roadmap.md`
- `docs/04_cafe_tycoon_system.md`
- `docs/06_content_economy_bm.md`
- `docs/16_customer_affection_meta.md`

---

## 이번 세션에서 수정 허용 범위

아래 범위 안에서만 작업해라.

- `app/*`
- `components/*`
- `features/*`
- `stores/*`
- `lib/*`
- `data/*`
- `locale/*`
- `tests/*`
- `docs/release_scope_1_0.md`
- `docs/figma_ui_swap_plan.md`
- `docs/codex_4th_pass_handoff.md`
- `prompts/next_cursor_task.md`

---

## 이번 세션에서 수정 금지 범위

- 게임의 큰 방향 자체를 바꾸는 리라이트
- 로비를 직접 이동형 구조로 되돌리기
- BM 범위 확장
- 대형 핵심손님 확장
- 주문 시스템 신규 구현
- 특별 원두 대형 기능 구현
- 새 디자인 시스템 갈아엎기
- 퍼즐 코어 규칙 대수정

---

## 구체 작업 지시

### 1. 현재 코드 구조 분석
아래를 먼저 정리해라.

- 레벨업 미션 목표치가 어디서 정해지는지
- 시간대 메뉴 해금/가격이 어디서 정해지는지
- 재료 원가와 판매 마진이 어디서 정해지는지
- 업그레이드 비용/효율이 어디서 정해지는지
- 오프라인 보상 cap/비율이 어디서 정해지는지
- 저장/불러오기와 버전 키가 어디 있는지
- 현재 UI에서 기능 셸로 유지할 영역과 Figma 교체 예정 영역이 어디인지
- test id / id / aria-label 중 교체 시 유지해야 할 앵커가 무엇인지

### 2. 문서-코드 차이점 정리
다음을 구분해서 정리해라.

- **실제로 완료된 것**
- **미완료**
- **placeholder / TODO**
- **버그 가능성**
- **중복 구조 위험**

### 3. 작은 범위의 안정화 수정
문서와 실제 코드가 다르거나, 다음 단계 진행을 막는 이슈가 있으면 아래만 수정해라.

- 1.0 포함 기능의 저장/표시 불일치
- 핵심 루프 QA 자동화 또는 재현 절차 추가
- 이미 정리한 비출시 표면(`/shop`, `pass/liveOps`, placeholder BM`)이 다시 과노출되지 않도록 유지
- `오프라인 보상 x2`, `퍼즐 결과 x2(코인+원두만)` 규칙을 해치지 않는 최소 정리
- rewarded ad `unsupported`는 새로운 BM 확장 없이 명확한 실패/비지원 경로로만 유지할 것
- web rewarded가 다시 `unsupported`면 store/claim을 건드리기 전에
  dev에서는 `DevDebugPanel`, 배포판에서는 `?ad_debug=1`의 `ReadOnlyAdDebugPanel`로
  page diagnostics + GPT 상태 + 마지막 `slotReturnedNull` debug를 먼저 확인할 것
- web rewarded가 `timeout`이면 inventory/no_fill보다 먼저
  `scriptLoaded`, `bootstrapStarted`, `bootstrapCompleted`,
  `servicesEnableAttempted`, `servicesEnabledByApp`,
  `slotAttempted`, `slotReturnedNull`과 script/CSP hint를 먼저 확인할 것
- `googletag.apiReady === true`인데 `cmd length`만 비정상인 경우는
  현재 코드에서는 bootstrap blocker가 아니다. 다시 같은 증상이 보이면
  `servicesEnableError`, `slotAttempted`, `slotReturnedNull` 이후 단계부터 확인할 것
- page/GPT 상태가 정상인데도 `slotReturnedNull=true`가 반복되면,
  코드보다 GAM의 `Block non-instream video ads`, rewarded ad unit/line item, 브라우저/웹뷰 지원 범위를 먼저 의심할 것
- reward claim 중복 수령 방지 / 새로고침 안정성 / mock 경로를 깨지 않는 범위만 다룰 것
- Figma 교체 전에 필요한 최소 셸 분리 또는 test anchor 유지 정리
- 구조 리라이트 없이 Playwright에서 고정 가능한 범위만 다룰 것

### 4. 문서 동기화
`docs/codex_4th_pass_handoff.md`를 실제 코드 기준으로 업데이트해라.

반드시 반영:
- 실제 변경 파일 목록
- 실제 저장 구조
- 실제 구현 완료 범위
- 남은 리스크
- 다음 작업 추천 3개

---

## 완료 기준

아래를 만족해야 이번 세션 완료로 본다.

1. 현재 코드 기준으로 성장 구조 핵심 수치가 어디서 바뀌는지 명확히 파악된다.
2. `release_scope_1_0.md`, `codex_4th_pass_handoff.md`, `prompts/next_cursor_task.md`가 같은 출시선 기준을 공유한다.
3. 이번에 고른 1.0 핵심 경로 1개가 자동 회귀 또는 재현 가능한 검증으로 고정된다.
4. 다음 세션에서 다른 1.0 핵심 경로를 하나씩 이어서 고정할 수 있다.

---

## 꼭 확인할 회귀 체크

- 새로고침 후 레벨/미션 상태 유지
- 새로고침 후 구매 레시피 유지
- 새로고침 후 재료 재고 유지
- 새로고침 후 도감 상태 유지
- 새로고침 후 장착 스킨 유지
- 시간대 레시피 구매 후 제작/판매/새로고침 유지 확인
- 손님 메타 v1(대표 손님 / 선호 보너스 / 단골 / 스토리 / day-boundary) 유지 확인
- 오프라인 보상 `90분 / 50%` 값이 성장 곡선을 과도하게 밀지 않는지 확인
- `퍼즐 결과 x2`를 붙이더라도 코인 + 원두 외 메타 진척이 늘어나지 않는지 확인
- `offline_reward_double`, `puzzle_result_double` 외 placement를 새로 열지 않았는지 확인
- 광고 mock 성공/취소/에러/노필/미지원에서 claim 상태가 꼬이지 않는지 확인
- web rewarded success / cancelled / no_fill / unsupported fallback에서 기본 보상 경로가 유지되는지 확인
- `unsupported`가 한 번 확인된 placement에서는 CTA가 다시 적극 노출되지 않고 비활성/안내 상태로 유지되는지 확인

---

## 작업 후 반드시 이 형식으로 보고

1. 작업 요약  
2. 변경 파일 목록  
3. 현재 구조 설명  
4. 검증 방법  
5. 남은 이슈  
6. 다음 추천 작업 3개  

---

## 다음 단계 후보 (이번 세션에서는 구현하지 말고 추천만)

- 시간대 레시피 구매 -> 제작 -> 판매 -> 새로고침 유지 QA 1건 추가
- 손님 day-boundary UI 결합 회귀 1건 보강
- `docs/gam_web_rewarded_setup.md` 기준 실 ad unit / line item 운영 점검 1회
- web rewarded 지원 환경/노필 비율 QA 1건 추가
- 1.1 앱 패키징 시 `src/lib/ads/rewardedAds.ts` 교체 포인트를 모바일 SDK 기준으로 분리 문서화
