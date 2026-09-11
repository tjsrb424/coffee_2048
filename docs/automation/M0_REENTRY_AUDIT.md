# M0 — Coffee 2048 프로젝트 재인수 Audit

## 목적

5월까지 개발된 Coffee 2048의 **실제 현재 상태**를 다시 파악한다.

이 단계에서는 개발하지 않는다.
코드와 자산을 읽고, 실행하고, 검증하고, 결과를 문서화한다.

최종 산출물:

`docs/automation/M0_REENTRY_REPORT.md`

---

## 절대 규칙

M0에서는 다음을 하지 않는다.

- 기능 구현
- UI 리디자인
- 리팩터링
- 이미지 교체
- 자산 삭제
- 경제/밸런스 변경
- save schema 변경

명백한 오류를 발견해도 **수정하지 말고 보고서에 기록**한다.

---

# 1. 저장소 구조 Audit

확인:

- `src/app/**`
- `src/components/**`
- `src/features/**`
- `src/stores/**`
- `src/hooks/**`
- `src/lib/**`
- `data/**`
- `image/**`
- `public/**`
- `locale/**`
- `.cursor/rules/**`
- `docs/**`

보고서에 다음을 작성한다.

```md
## 코드 구조
- route:
- feature:
- store:
- shared UI:
- test:
- scripts:
```

---

# 2. 실제 화면 / Route Inventory

최소 확인 대상:

- 메인/진입
- 퍼즐
- 로비
- 로스터
- 쇼케이스/메뉴 제작
- 카운터
- 기타 현재 존재 route

각 화면:

```md
### /route
상태: 정상 / 부분구현 / 깨짐 / legacy
목적:
핵심 컴포넌트:
연결 store:
UI 상태:
문제:
```

---

# 3. 퍼즐 Audit

확인 항목:

- 4x4 board
- tile spawn
- four-direction movement
- merge rule
- single merge per turn
- score
- game over
- touch swipe
- keyboard input
- move animation
- spawn animation
- reward calculation
- puzzle → meta 반영
- puzzle skin/theme 존재 여부

특히 **새 퍼즐 엔진을 제안하기 전에 현재 엔진을 충분히 이해한다.**

---

# 4. Lobby / Cafe Loop Audit

확인:

- 로비 메인 구조
- Resource HUD
- Roaster
- Showcase / Workbench
- Counter
- 판매 시작 조건
- 판매 중 상태
- 재고 소모
- 코인 획득
- 퍼즐 진입
- bottom sheet / card UX

실제 루프:

`퍼즐 → 원두 → 로스팅 → 제작/진열 → 판매 → 결과`

이 루프에서 사용자가 막히거나 상태를 이해하기 어려운 지점을 별도 기록한다.

---

# 5. Customer / Relationship Audit

확인:

- customer static data
- runtime state
- 핵심/일반 손님 분리
- 애정도
- 가게 애정도
- 오늘의 손님
- 선호 메뉴
- 단골
- story fragment
- 판매 세션에서 손님 배분

보고:

- 현재 실제 작동하는 것
- 코드만 존재하고 UX에서 보이지 않는 것
- 데이터는 있으나 미완성인 것

---

# 6. Save / Persistence Audit

확인:

- persisted store
- save version
- migration
- localStorage 등 저장 위치
- puzzle/meta/customer 저장 경계
- reload 후 유지되는 값
- 과거 save compatibility 위험

세이브 위험은 별도 `HIGH RISK`로 표시한다.

---

# 7. Asset Audit

## 우선 디렉터리

- `image/drink/**`
- `image/ui/**`
- `public/assets/**`
- title/logo
- lobby background
- puzzle background/block
- customer assets

## 음료 이미지

현재 `image/drink`에 이미 여러 음료 PNG가 존재하므로 반드시 먼저 inventory한다.

각 자산을:

| Asset | 사용 위치 | 상태 | 판정 | 메모 |
|---|---|---|---|---|
| file | route/component | 정상/미사용/중복 | REUSE/POLISH/LEGACY/NEEDED | |

으로 정리한다.

`LEGACY`는 삭제 대상이라는 뜻이 아니다.

---

# 8. UI/UX Audit

다음 기준으로 본다.

## 정보 전달

- 지금 무엇을 할 수 있는지 보이는가
- 자원 부족 이유가 보이는가
- 판매 상태가 보이는가
- puzzle reward가 lobby에 연결됐다는 느낌이 있는가

## 모바일

- 터치 타깃
- 글자 크기
- bottom sheet 높이
- 주요 CTA
- 화면 넘침

## 감성

- premium/cozy 유지
- 관리툴처럼 보이지 않는가
- motion이 과하지 않는가
- 기존 자산과 UI 톤이 맞는가

## 결과 분류

- `BLOCKER` — 플레이 방해
- `HIGH` — 체감이 크게 나쁨
- `MEDIUM` — polish 필요
- `LOW` — 후순위

---

# 9. 문서 vs 실제 코드 비교

최소 비교:

- `AGENTS.md`
- `docs/08_dev_roadmap.md`
- `docs/11_lobby_interaction_direction.md`
- `docs/14_cursor_handoff_update.md`
- `docs/automation/**`

다음처럼 정리한다.

```md
## 문서 충돌

### 항목
문서:
실제 코드:
판정:
권장:
```

특히 과거 문서가 현재 코드보다 오래된 경우 **코드를 임의로 과거 문서에 맞춰 되돌리지 않는다.**

---

# 10. 자동 검증

가능한 범위에서 실행:

```bash
npm install
npm run lint
npm run typecheck
npm run build
npm run test:visual
```

필요한 dependency가 이미 설치돼 있다면 불필요한 재설치는 하지 않는다.

각 명령의:

- 성공/실패
- 실행 오류
- 실패 파일
- M0 이후 수정 필요 여부

를 기록한다.

---

# 11. M0 보고서 필수 형식

`docs/automation/M0_REENTRY_REPORT.md`

```md
# Coffee 2048 M0 Reentry Report

## 1. Executive Summary
현재 완성도:
현재 플레이 가능 범위:
가장 큰 문제 3개:

## 2. 실제 구현 상태
### Puzzle
### Lobby
### Cafe Loop
### Customer
### Save

## 3. Asset Inventory
### 재사용 확정
### 보정 후보
### Legacy
### 실제 신규 필요

## 4. UI/UX 문제
### Blocker
### High
### Medium
### Low

## 5. 검증 결과
- lint:
- typecheck:
- build:
- visual:

## 6. 문서와 코드의 차이

## 7. 리스크

## 8. 다음 마일스톤 제안
### M1
### M2
### M3

## 9. 추천 첫 자동개발 범위
예: M1~M2

## 10. 사용자 직접 확인이 필요한 것
```

---

# 완료 조건

M0는 **코드가 좋아졌을 때** 완료가 아니다.

현재 프로젝트를 다시 정확히 이해해서 다음 개발 범위를 안전하게 선택할 수 있을 때 완료다.
