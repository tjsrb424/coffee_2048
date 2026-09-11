# Coffee 2048 — Development Queue

## 사용법

이 문서는 현재 AI가 어디까지 작업해도 되는지를 고정한다.

상태값:

- `ACTIVE` — 지금 작업
- `READY` — 사용자 승인 후 바로 작업 가능
- `WAITING` — 이전 마일스톤 결과 필요
- `BLOCKED` — 결정/정보 필요
- `DONE` — 완료

AI는 `ACTIVE` 범위를 넘어 개발하지 않는다.

---

# CURRENT OBJECTIVE

## M0 — 프로젝트 재인수

- 상태: `ACTIVE`
- 개발 코드 수정: `금지`
- 문서/분석 산출물 작성: `허용`

### 목표

현재 저장소의 실제 구현/자산/검증 상태를 파악하고 다음 자동개발 범위를 결정한다.

### 수행 문서

`docs/automation/M0_REENTRY_AUDIT.md`

### 완료 산출물

`docs/automation/M0_REENTRY_REPORT.md`

### Done Condition

- [ ] 실제 화면/route 목록 확인
- [ ] 퍼즐 현재 상태 확인
- [ ] 로비 현재 상태 확인
- [ ] 로스터/쇼케이스/카운터 확인
- [ ] 메타/손님/애정도 구조 확인
- [ ] save 구조 확인
- [ ] 기존 커피/원두/UI 자산 inventory
- [ ] 사용 중/미사용/legacy 자산 분류
- [ ] lint 결과
- [ ] typecheck 결과
- [ ] build 결과
- [ ] visual test 가능 여부/결과
- [ ] 문서와 코드 불일치 목록
- [ ] UX blocker 목록
- [ ] M1~ 이후 권장 범위 재산정

---

# QUEUE

## M1 — 현재 플레이 루프 안정화

- 상태: `WAITING`
- 선행: M0

M0 결과에서 실제 blocker를 뽑아 확정한다.

---

## M2 — 핵심 손님 개인화

- 상태: `WAITING`
- 선행: M0, 필요 시 M1

후보:

- 핵심 손님별 다른 문구/반응
- 선호 메뉴 피드백
- 작은 흔적/보상
- 애정도 UX

---

## M3 — 스토리 조각 2단계

- 상태: `WAITING`
- 선행: M2

---

## M4 — 특별 원두 시간대

- 상태: `WAITING`
- 선행: M0

---

## M5 — 성장 / 저장 통합

- 상태: `WAITING`
- 선행: M0, M1

---

# 작업 범위 명령 예시

사용자가 아래처럼 지시할 수 있다.

```text
M1만 구현해.
```

```text
M1~M3까지 플레이 가능한 상태로 개발하고 보고해.
```

```text
M2까지만 진행. M3은 건드리지 마.
```

그 범위 안에서는 `PROJECT_RULES.md`의 AUTO 항목을 AI가 스스로 판단한다.

---

# Decision Gate

작업 중 아래 상황이 나오면 queue 상태를 `BLOCKED`로 바꾸고 사용자에게 보고한다.

- 핵심 루프 변경 필요
- save breaking change 필요
- 대규모 아키텍처 변경 필요
- 기존 주요 화면 폐기 필요
- 기존 자산 대량 삭제 필요
- 승인 범위를 넘어야만 구현 가능
- 유료 API/서비스 필요

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
