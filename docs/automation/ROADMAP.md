# Coffee 2048 — GPT Autonomous Development Roadmap

## 문서 상태

- 상태: `LOCKED AFTER M0`
- M0: `DONE`
- 다음 권장 단계: `M1 — 1.0 기준선 복구 및 Source-of-Truth 정렬`
- 실행 주체: ChatGPT/GPT

이 문서는 과거 `docs/08_dev_roadmap.md`를 삭제하지 않는다.
다만 실제 현재 코드가 과거 roadmap보다 훨씬 진행되어 있으므로, 이후 자동개발 실행 순서는 이 문서를 우선한다.

---

# 현재 베이스라인

이미 구현된 축:

- 2048 puzzle core / reward claim
- 고품질 lobby 1차 비주얼
- roasting / workbench / counter 최신 화면
- 실제 cafe economy / material / recipe / auto-selling
- account level / mission / unlock
- standard recipe / time-shop recipe
- cafe upgrade
- beverage codex
- save/load/offline reward
- guest meta v1
- rewarded claim 2종
- desktop/mobile Playwright

현재 가장 큰 과제는 새 기능 부족이 아니라 **최신 비주얼 UI와 실제 domain source of truth의 정렬 및 regression baseline 회복**이다.

---

# M0 — 프로젝트 재인수

- 상태: `DONE`
- 결과: `docs/automation/M0_REENTRY_REPORT.md`

핵심 결론:

- 프로젝트를 다시 만들지 않는다.
- 성장/save/customer v1은 이미 상당 부분 구현되어 있으므로 재구현하지 않는다.
- 최신 UI 일부가 실제 domain model과 의미가 어긋나므로 이를 먼저 정렬한다.

---

# M1 — 1.0 기준선 복구 및 Source-of-Truth 정렬

## 상태

`READY`

사용자가 M1 구현을 승인하면 GPT가 별도 작업 branch에서 진행한다.

## 목표

**현재 이미 구현된 1.0 기능을 최신 UI에서 실제 규칙 그대로 작동시키고 CI를 녹색으로 만든다.**

## A. Workbench 정렬

- 화면 내부 hardcoded recipe/material preview 제거 또는 adapter화
- 실제 `visibleMenuOrder` 사용
- 실제 recipe ownership 사용
- 실제 material inventory 사용
- 실제 `validateCraftDrink` 사용
- 실제 `craftDrink` 결과와 CTA 상태 일치

## B. Counter 정렬

- 화면의 판매 상태를 실제 auto-selling store와 정렬
- `selectedDrinkIds`처럼 실제 mechanics에 반영되지 않는 local 선택은 기능처럼 보이지 않도록 수정
- 신규 sale-filter/save mechanic은 M1에서 추가하지 않음
- featured customer / queue / progress / stock을 실제 상태 기준으로 표시

## C. Roaster 정렬

- 현재 1.0 `roastOnce()` mechanics 유지
- 원두/배전 선택이 실제 별도 경제 효과가 있는 것처럼 오해되지 않게 정리
- special beans / roast-depth mechanics는 post-1.0

## D. Regression test 복구

- customer sale-flow 최신 Counter UI 계약으로 갱신
- customer persistence 최신 copy/layout에 맞추되 persisted state assertion은 유지
- recipe ownership은 실제 shop/cafe ownership source를 검증
- `/codex`는 collection/craft-stage semantics로 검증
- Linux lobby/puzzle visual baseline 정리

## E. Core smoke

Desktop + Mobile에서 아래를 자동 검증:

`puzzle → reward → lobby → roast → craft → sale → coin/customer update → reload`

## F. Dependency / CI hygiene

- npm audit 8건 원인 확인
- safe non-breaking update만 자동 적용 가능
- breaking upgrade는 Decision Gate
- GitHub Actions runtime warning 점검

## 완료 조건

- lint PASS
- typecheck PASS
- build PASS
- 핵심 Playwright desktop/mobile PASS
- visual baseline 정상
- 최신 UI와 domain source의 의미 일치
- save/migration 회귀 없음

---

# M2 — Core UI/UX + Asset Quality Pass

## 상태

`WAITING: M1`

## 목표

1.0 mechanics를 바꾸지 않고 화면 품질과 일관성을 올린다.

## 범위

- lobby / roaster / workbench / counter / cafe shop / codex 시각 언어 통일
- 모바일 lobby onboarding / PLAY overlap 개선
- `(임시 화면)` 상태인 `/lobby/shop` 비주얼 교체
- spacing / hierarchy / touch target / state feedback 정리
- 기존 음료/UI/배경 asset 전수 품질 판정

## 이미지 정책

- 기존 asset을 먼저 비교
- 품질 이득이 명확하면 GPT 이미지 생성/신규 적용 허용
- 원본은 즉시 삭제하지 않음
- `REUSE / POLISH / REPLACE / LEGACY / NEEDED` 판정 유지

## 완료 조건

- 코어 화면 간 상업적 완성도 격차가 크게 줄어듦
- 모바일/데스크톱 visual regression PASS
- mechanics 변경 없음

---

# M3 — 1.0 Release Candidate

## 상태

`WAITING: M2`

## 목표

현재 `docs/release_scope_1_0.md`의 범위를 실제 출시 후보 상태로 닫는다.

## 범위

- full regression
- save/load/reload/migration QA
- offline reward QA
- rewarded-ad unsupported/fallback QA
- 1.0 제외 surface 노출 점검
- performance / mobile / accessibility
- static deployment 검수
- release checklist

## 완료 조건

1.0 범위에서 blocker가 없고 사용자가 직접 전체 core loop를 플레이 검수할 수 있다.

---

# M4 — 핵심 손님 관계 심화 (Post-1.0 후보)

M3 완료 후 사용자 승인 시 진행.

후보:

- 핵심 손님별 더 강한 개성
- 관계 반응
- 스토리 단계 확장
- 작은 흔적/보상 고도화

현재 guest meta v1은 1.0 범위로 이미 구현되어 있으므로 M1~M3보다 먼저 확장하지 않는다.

---

# M5 — Special Beans / Orders (Post-1.0 후보)

후보:

- 특별 원두
- 배전별 실제 gameplay 차이
- 주문 시스템
- 시간/조건 콘텐츠

현재 1.0 release scope 밖이다.

---

# M6 — Expansion

후보:

- 꾸미기
- 이벤트
- 시즌
- 특수 타일 확장
- liveOps
- broader BM
- localization expansion

---

# 실행 규칙

사용자가 아래처럼 승인한다.

```text
M1 진행해.
```

또는

```text
M1~M2까지 진행해.
```

GPT는 승인 범위 내부에서는 필요한 코드/UI/UX/test/asset 작업을 스스로 세분화해 진행한다.

다만 아래는 중단 후 결정 요청:

- core loop 변경
- save breaking change
- offline economy semantics 변경
- 대규모 architecture replacement
- 주요 콘텐츠 삭제
- 유료 외부 API/service 필요
