# M0 — Coffee 2048 프로젝트 재인수 Audit

## 상태

`DONE`

실행 주체: ChatGPT/GPT

결과 문서:

- `docs/automation/M0_REENTRY_REPORT.md`

---

## 목적

5월까지 개발된 Coffee 2048의 실제 현재 상태를 코드/문서/asset/CI 기준으로 다시 파악한다.

M0에서는 제품 기능을 수정하지 않는다.

---

## M0에서 확인한 범위

### 저장소 구조

- `src/app/**`
- `src/components/**`
- `src/features/**`
- `src/stores/**`
- `src/hooks/**`
- `src/lib/**`
- `src/data/**`
- `data/**`
- `image/**`
- `public/**`
- `locale/**`
- `tests/**`
- `docs/**`

### 화면

- lobby
- puzzle
- roaster
- workbench
- counter
- cafe/shop
- codex/drinkdex
- settings/extension/time-shop

### Domain

- puzzle engine/session
- cafe economy
- recipe/material
- auto sale/offline
- customer/affection/story
- progression/mission
- save/migration
- rewarded claim

### Asset

- original drink PNG
- optimized runtime drink assets
- lobby assets
- roasting assets
- drinkstation assets
- counter reference
- brand/ui/ingame images

### 자동 검증

- npm ci
- lint
- typecheck
- build
- Playwright desktop/mobile
- workflow logs/artifacts/screenshots

---

## 원래 절대 규칙

M0 진행 중 하지 않은 것:

- feature 구현
- UI redesign
- gameplay balance 변경
- image 교체
- asset 삭제
- save schema 변경
- core architecture refactor

---

## M0 핵심 발견

1. 실제 repo가 과거 roadmap보다 훨씬 진행되어 있음
2. growth/save/customer v1은 이미 상당 부분 구현
3. 최신 lobby/puzzle 비주얼 품질은 높은 편
4. 최신 Workbench/Counter/Roaster 일부가 domain source와 의미상 drift
5. regression tests 일부가 구 UI 계약을 기대
6. lint/typecheck/build는 성공
7. Playwright는 baseline/test contract drift로 완전 green이 아님

세부 내용은 `M0_REENTRY_REPORT.md`를 source of truth로 사용한다.

---

## 이후

M0 완료 후 roadmap을 재산정했다.

- M1: 1.0 기준선 복구 및 Source-of-Truth 정렬
- M2: Core UI/UX + Asset Quality Pass
- M3: 1.0 Release Candidate
- M4+: post-1.0 콘텐츠

M1 구현은 사용자 승인 후 시작한다.
