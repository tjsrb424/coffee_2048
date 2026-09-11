# Coffee 2048 — GPT Development Queue

## 상태값

- `ACTIVE` — 현재 구현 중
- `READY` — 범위 확정, 사용자 승인 시 바로 구현 가능
- `WAITING` — 선행 마일스톤 필요
- `BLOCKED` — 사용자 결정 필요
- `DONE` — 완료

GPT는 사용자가 명시적으로 승인한 범위를 넘어 개발하지 않는다.

---

# M0 — 프로젝트 재인수

- 상태: `DONE`
- 실행 주체: `ChatGPT/GPT`
- 제품 코드 수정: 없음
- 결과 문서: `docs/automation/M0_REENTRY_REPORT.md`

완료:

- [x] route/screen inventory
- [x] puzzle 상태 확인
- [x] lobby 상태 확인
- [x] roaster/workbench/counter 확인
- [x] meta/customer 구조 확인
- [x] save/migration 확인
- [x] asset inventory
- [x] lint/typecheck/build 확인
- [x] Playwright 결과 분류
- [x] 문서 vs 실제 코드 차이 정리
- [x] UX blocker 정리
- [x] M1 이후 roadmap 재산정

---

# NEXT — M1: 1.0 기준선 복구 및 Source-of-Truth 정렬

- 상태: `READY`
- 선행: M0 완료
- 권장 범위: **M1만 먼저 구현**

## 목표

현재 이미 만들어진 1.0 기능을 최신 UI에서 실제 규칙과 동일하게 작동시키고 자동 검증 기준선을 복구한다.

## Scope

### 1. Workbench
- [ ] hardcoded recipe/material preview 정리
- [ ] actual recipe ownership 연결
- [ ] actual material inventory 연결
- [ ] actual `validateCraftDrink` 연결
- [ ] actual `craftDrink`와 UI CTA 결과 일치

### 2. Counter
- [ ] local 선택 UI와 실제 auto-selling 의미 정렬
- [ ] 실제 mechanics에 반영되지 않는 선택은 기능처럼 보이지 않게 정리
- [ ] featured customer / stock / queue / selling status 실제 상태 연결
- [ ] 신규 sale filter/save mechanic은 추가하지 않음

### 3. Roaster
- [ ] `roastOnce()` mechanics와 UI 의미 정렬
- [ ] 원두/배전 선택이 미구현 효과를 약속하지 않게 정리
- [ ] special bean mechanics 추가 금지

### 4. Tests
- [ ] customer sale-flow 최신 UI 계약
- [ ] customer persistence 최신 copy/layout
- [ ] persisted state assertion 유지
- [ ] recipe ownership 실제 shop/cafe source 검증
- [ ] codex collection semantics 검증
- [ ] Linux visual baseline 추가/정리

### 5. Core smoke
- [ ] puzzle → reward
- [ ] lobby
- [ ] roast
- [ ] craft
- [ ] sale
- [ ] coin/customer update
- [ ] reload persistence
- [ ] desktop/mobile

### 6. CI / dependency
- [ ] lint PASS
- [ ] typecheck PASS
- [ ] build PASS
- [ ] Playwright 핵심 suite PASS
- [ ] npm audit 원인 확인
- [ ] breaking dependency update는 Decision Gate

## 완료 조건

M1 완료 시 사용자에게 다음을 보고한다.

- 변경 파일
- UI 의미 변경
- 실제 mechanics 연결 방식
- CI 결과
- Playwright 결과
- 직접 플레이 검수 항목
- M2 진행 추천 여부

---

# M2 — Core UI/UX + Asset Quality Pass

- 상태: `WAITING`
- 선행: M1

범위:

- 화면별 visual quality 통일
- lobby onboarding / PLAY mobile overlap
- cafe shop 임시 UI 교체
- counter/workbench/roaster/codex polish
- asset quality audit
- 필요 시 신규 이미지 생성/교체

mechanics 확장은 하지 않는다.

---

# M3 — 1.0 Release Candidate

- 상태: `WAITING`
- 선행: M2

범위:

- full regression
- save/migration/offline/ad fallback
- mobile/performance/accessibility
- release scope 노출
- deployment readiness

---

# Post-1.0

M3 이후 별도 승인:

- M4: 핵심 손님 관계/스토리 심화
- M5: 특별 원두 / 주문
- M6: 이벤트 / 시즌 / 꾸미기 / liveOps / 확장 BM

---

# Decision Gate

작업 중 아래 상황이면 자동 진행을 멈추고 사용자에게 보고한다.

- core gameplay loop 변경
- save breaking change
- offline economy semantics 변경
- 대규모 architecture replacement
- 주요 콘텐츠 대량 삭제
- 승인 범위를 넘어야만 구현 가능
- 유료 API/service 필요

보고 형식:

```md
# DECISION REQUIRED
## 현재 작업
## 발견한 문제
## 왜 사용자 결정이 필요한가
## 선택지
A.
B.
## 추천
## 영향 범위
```
