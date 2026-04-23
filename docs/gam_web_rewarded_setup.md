# Web 1.0 Rewarded Ad 운영 세팅 체크리스트

## 1) 목적

이 문서는 `Coffee 2048` web 1.0 출시선에서 보상형 광고 운영 세팅을
실수 없이 이어가기 위한 고정 체크리스트다.

범위:
- 코드 기능 추가가 아니라 운영/배포 세팅 정리
- `requestRewardedAd(placement)` 뒤의 기존 adapter 구조를 전제로 함
- placement 2종(`offline_reward_double`, `puzzle_result_double`)만 다룸

비범위:
- BM 표면 확장
- 퍼즐 코어 규칙 변경
- 저장 스키마 변경
- 광고 provider 구조 리라이트

---

## 2) 웹 1.0 rewarded ad 현재 구조 요약

현재 레포 기준 구조:
- 외부 진입점은 `requestRewardedAd(placement)` 단일 함수
- provider 분기:
  - `mock`
  - `web-gpt-rewarded` (GPT + GAM rewarded)
  - `unsupported` fallback
- 결과 상태 분기:
  - `rewarded`
  - `cancelled`
  - `error`
  - `no_fill`
  - `unsupported`

운영상 중요한 원칙:
- UI는 provider 종류를 모름 (status만 해석)
- 광고 reward callback이 와도 즉시 자원 지급하지 않음
- 최종 지급은 store claim 함수에서만 처리
- `claimId` 기반 중복 수령 방지 유지

관련 코드:
- adapter: `src/lib/ads/rewardedAds.ts`
- 오프라인 x2 UI: `src/features/lobby/components/OfflineSalesCard.tsx`
- 퍼즐 결과 x2 UI: `src/features/puzzle2048/components/PuzzleScreen.tsx`
- 지급/중복방지 로직: `src/stores/useAppStore.ts`

---

## 3) placement 2종 정의

운영 허용 placement는 아래 2개만 사용한다.

- `offline_reward_double`
  - 로비 오프라인 보상 카드의 `광고 보고 2배`
  - 성공 시 해당 오프라인 코인 정산만 x2

- `puzzle_result_double`
  - 퍼즐 결과 모달의 `광고 보고 코인+원두 x2`
  - 성공 시 퍼즐 결과 보상 정책에 따라 일부 항목만 x2

금지:
- 새로운 placement 임의 추가
- 같은 placement를 다른 BM 표면에 재사용

---

## 4) 퍼즐 결과 x2 정책 (고정)

`puzzle_result_double` 성공 시:
- 코인: x2
- 원두: x2

배수 제외(항상 base 유지):
- 하트
- 미션 진행도/레벨 진척
- 도감/해금/시간대 메타 진척
- 손님 메타(애정도/스토리/단골 등)

검증 포인트:
- `useAppStore.claimPuzzleReward`에서 지급/기록 정책 확인
- `tests/visual/rewarded-ad-claims.spec.ts` 회귀 유지

---

## 5) 필요한 env 목록과 설명

아래 env를 배포 환경에 명시한다.

- `NEXT_PUBLIC_REWARDED_AD_PROVIDER`
  - 값: `auto` | `mock` | `web-gpt-rewarded` | `unsupported`
  - 권장:
    - dev: `mock` 또는 `auto`
    - prod: `web-gpt-rewarded` (ad unit 준비 완료 시)

- `NEXT_PUBLIC_GAM_REWARDED_OFFLINE_AD_UNIT_PATH`
  - `offline_reward_double`에 매핑할 GAM rewarded ad unit path
  - 예시 형식: `/network_code/...`

- `NEXT_PUBLIC_GAM_REWARDED_PUZZLE_AD_UNIT_PATH`
  - `puzzle_result_double`에 매핑할 GAM rewarded ad unit path

- `NEXT_PUBLIC_GAM_REWARDED_SCRIPT_URL`
  - 기본값: `https://securepubads.g.doubleclick.net/tag/js/gpt.js`
  - 특별한 이유가 없으면 기본값 유지

- `NEXT_PUBLIC_REWARDED_AD_REQUEST_TIMEOUT_MS`
  - 광고 요청 타임아웃(ms)
  - 기본값: `8000`
  - 운영 권장: 5000~10000 범위에서 네트워크/UX 보고 조정

운영 체크:
- prod에서 provider를 `web-gpt-rewarded`로 두었는데 ad unit path가 비어 있으면 `unsupported`로 떨어짐
- build/배포 파이프라인에서 env 누락 여부를 배포 전 체크

### 5-1. 현재 프로젝트 반영값

이번 기준으로 확정된 값은 아래다.

- `NEXT_PUBLIC_REWARDED_AD_PROVIDER=web-gpt-rewarded`
- `NEXT_PUBLIC_GAM_REWARDED_OFFLINE_AD_UNIT_PATH=/23350518234/rewarded_offline_double`
- `NEXT_PUBLIC_GAM_REWARDED_PUZZLE_AD_UNIT_PATH=/23350518234/rewarded_puzzle_double`
- `NEXT_PUBLIC_GAM_REWARDED_SCRIPT_URL=https://securepubads.g.doubleclick.net/tag/js/gpt.js`
- `NEXT_PUBLIC_REWARDED_AD_REQUEST_TIMEOUT_MS=8000`

### 5-2. 현재 레포에서 어디에 넣는가

- 로컬 실행:
  - `.env.local`
- 커밋 가능한 템플릿:
  - `.env.example`
- GitHub Pages / static export 배포:
  - `.github/workflows/deploy-pages.yml`의 `Build (Next.js export)` step `env`

주의:
- `.env.local`은 `.gitignore`에 의해 커밋되지 않는다
- GitHub Pages 정적 배포는 빌드 시점 env를 읽으므로, workflow build step에 값이 있어야 한다
- PR/시각 테스트용 workflow에는 현재 값을 강제로 넣지 않았다. dev/test 기본 mock 경로를 깨지 않기 위해서다

---

## 6) GAM에서 준비해야 할 실제 항목

### 6-1. ad unit 준비
- rewarded용 ad unit 2개 생성(placement별 분리 권장)
  - offline용 1개
  - puzzle용 1개
- 두 ad unit path를 각각 env에 매핑

### 6-2. inventory / line item 준비
- web rewarded 인벤토리 연결
- 테스트 단계:
  - 테스트 크리에이티브/테스트 트래픽 우선
  - 노출/채움(fill)과 이벤트 동작 먼저 확인
- 실광고 단계:
  - 실제 line item으로 전환
  - 빈도/타게팅/우선순위/가격 정책 조정

### 6-3. 테스트 광고와 실광고 구분
- 테스트 단계와 실광고 단계를 반드시 분리 운영
- 배포 전 체크리스트에 아래를 포함:
  - 현재 line item이 test인지 prod인지
  - 테스트 크리에이티브가 실환경에 남아있지 않은지
  - 운영 계정 권한/승인 상태 확인

### 6-4. fill / no-fill 확인 포인트
- 최소 확인 항목:
  - 요청 대비 ready 발생률
  - no_fill 비율
  - placement별 편차(offline vs puzzle)
- no_fill이 높으면:
  - inventory/line item 설정
  - 타게팅/제약
  - 지역/디바이스 지원범위
  - 트래픽 볼륨
  순으로 점검

---

## 7) unsupported / no_fill / cancel / error 대응 정책

정책 목표:
- 광고 실패/미지원에서도 기본 보상 루프가 깨지지 않음
- claim pending이 임의 소모되지 않음

상태별 운영 정책:
- `rewarded`
  - 광고 x2 claim 진행
- `cancelled`
  - 광고 배수 미적용
  - 유저는 기본 수령 경로로 즉시 복귀 가능
- `no_fill`
  - 광고 배수 미적용
  - 기본 수령 경로 유지
- `unsupported`
  - 광고 배수 미적용
  - 기본 수령 경로 유지
- `error`
  - 광고 배수 미적용
  - 기본 수령 경로 유지

필수 유지 조건:
- 실패 상태에서 pending claim 삭제 금지
- 성공 상태에서만 x2 claim 함수 호출

---

## 8) dev/mock/test mode 정책

### 8-1. 기본 원칙
- dev 기본은 mock fallback 우선
- 실제 web provider 경로 검증은 명시적으로 전환해서 실행

현재 로컬 `.env.local` 반영값은 `web-gpt-rewarded`다.
즉, 로컬 dev를 그대로 띄우면 실제 web provider 경로를 먼저 타게 된다.

### 8-2. local override (디버그)
- provider override:
  - `coffee2048_rewarded_ad_provider_override`
  - 값: `mock` | `web-gpt-rewarded` | `unsupported` | `auto`
- mock outcome:
  - `coffee2048_mock_rewarded_ad_outcome`
  - 값: `success` | `cancel` | `error` | `no_fill` | `unsupported`
- ad unit override:
  - `coffee2048_rewarded_gpt_offline_ad_unit_path`
  - `coffee2048_rewarded_gpt_puzzle_ad_unit_path`

### 8-3. 테스트 정책
- 기존 회귀:
  - `tests/visual/rewarded-ad-claims.spec.ts`
- web provider 경로 회귀:
  - `tests/visual/web-gpt-rewarded.spec.ts`
  - fake `googletag` 기반으로 success/cancel/no_fill/unsupported 검증

### 8-4. 개발/테스트에서 mock <-> 실광고 전환 방법

- 실광고 provider 경로 확인:
  - `.env.local`의 `NEXT_PUBLIC_REWARDED_AD_PROVIDER=web-gpt-rewarded` 유지
  - 필요한 ad unit path 2종 유지
- mock으로 임시 전환:
  - 브라우저 디버그 패널에서 provider override를 `mock`으로 변경
  - 또는 `.env.local`에서 provider 값을 `mock`으로 바꾼 뒤 dev server 재시작
- 미지원 fallback 확인:
  - 디버그 패널에서 provider override를 `unsupported`로 변경
- mock 결과별 확인:
  - 디버그 패널에서 `success / cancel / error / no_fill / unsupported` 선택

운영 권장:
- 로컬 수동 QA는 `.env.local` + 디버그 override를 사용
- 자동 테스트는 기존 mock/fake provider 기반 회귀를 유지

---

## 9) 실제 출시 전 QA 체크리스트

### 9-1. 사전 설정
- [ ] prod env 5종이 배포 환경에 정확히 주입됨
- [ ] `offline`/`puzzle` ad unit path가 서로 다른 placement에 정확히 연결됨
- [ ] 테스트 line item과 실 line item 구분 상태 확인

### 9-2. 기능/정책
- [ ] `offline_reward_double` 성공 시에만 x2 적용
- [ ] `puzzle_result_double` 성공 시 코인+원두만 x2 적용
- [ ] 퍼즐 하트/미션/도감/손님 메타는 배수되지 않음
- [ ] claim 후 새로고침 시 중복 수령 불가
- [ ] 광고 실패 상태(`cancelled`, `error`, `no_fill`, `unsupported`)에서 기본 수령 가능

### 9-3. 환경/운영
- [ ] 지원 브라우저/디바이스에서 rewarded 노출 가능 여부 확인
- [ ] 미지원 환경에서 `unsupported` fallback이 UX를 깨지 않는지 확인
- [ ] no_fill 비율 모니터링 기준 수립(placement별)

### 9-4. 회귀
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] rewarded 관련 Playwright 타깃 테스트 통과 확인

---

## 10) 1.1 앱 패키징 전환 시 교체 포인트

1.1에서 앱 패키징 + 모바일 SDK로 갈 때의 원칙:
- 유지:
  - `requestRewardedAd(placement)` 외부 계약
  - placement 2종
  - claim/store 최종 권한
  - 퍼즐 x2 정책(코인+원두만)
- 교체:
  - `src/lib/ads/rewardedAds.ts` 내부 provider 구현
  - web-gpt-rewarded 분기를 모바일 SDK adapter로 대체/확장

즉, 운영 전환은 provider 내부 구현 교체 중심으로 하고,
UI/스토어/보상 정책 계약은 유지하는 것이 안전하다.

---

## 11) 운영 인수인계 최소 절차

1) 이 문서 확인  
2) env 5종 주입 확인  
3) GAM ad unit 2개/line item 상태 확인  
4) 지원/미지원/no_fill 시나리오 QA  
5) 배포 후 fill 지표 추적 및 line item 조정
