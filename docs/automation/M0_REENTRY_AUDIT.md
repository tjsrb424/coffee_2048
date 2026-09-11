# M0 — Coffee 2048 프로젝트 재인수 Audit

## 목적
5월까지 개발된 Coffee 2048의 **실제 현재 상태**를 GPT가 직접 GitHub 저장소를 기준으로 다시 파악한다.

이 단계에서는 제품 코드를 개발하거나 수정하지 않는다.
코드와 자산을 읽고, 검증 인프라를 확인하고, 결과를 문서화한다.

최종 산출물:
`docs/automation/M0_REENTRY_REPORT.md`

---

## 실행 주체
- ChatGPT/GPT가 직접 수행
- Cursor 전달 과정 없음
- 별도 유료 AI/API 없음
- GitHub Actions는 lint/typecheck/build/visual test 검증용으로 사용 가능

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

명백한 오류를 발견해도 수정하지 말고 보고서에 기록한다.

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
- `docs/**`
- `.github/workflows/**`

# 2. 실제 화면 / Route Inventory
최소 확인 대상:
- 메인/진입
- 퍼즐
- 로비
- 로스터
- 쇼케이스/메뉴 제작
- 카운터
- 설정/상점/도감 등 현재 존재 route

각 화면은 정상/부분구현/깨짐/legacy로 분류한다.

# 3. 퍼즐 Audit
확인:
- 4x4 board
- tile spawn
- four-direction movement
- merge rule
- score/game over
- touch swipe / keyboard
- move/spawn animation
- reward calculation
- puzzle → meta 반영
- puzzle skin/theme

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

# 5. Customer / Relationship Audit
확인:
- customer static data/runtime state
- 핵심/일반 손님
- 애정도/가게 애정도
- 오늘의 손님
- 선호 메뉴
- 단골/story fragment
- 판매 세션 손님 배분

# 6. Save / Persistence Audit
확인:
- persisted store
- save version/migration
- localStorage 등 저장 위치
- puzzle/meta/customer 저장 경계
- reload 유지 값
- 과거 save compatibility 위험

# 7. Asset Audit
우선:
- `image/drink/**`
- `image/ui/**`
- `public/assets/**`
- title/logo
- lobby/puzzle/customer assets

분류:
- REUSE
- POLISH
- REPLACE
- LEGACY
- NEEDED

`REPLACE`는 기존 자산보다 새 제작물이 의미 있게 품질을 높일 때만 사용한다. M0에서는 실제 교체하지 않고 후보만 기록한다.

# 8. UI/UX Audit
- 상태/자원/다음 행동 전달력
- 모바일 터치/가독성/overflow
- popup/bottom sheet 밀도
- premium/cozy 일관성
- puzzle reward → lobby 연결 체감

심각도:
- BLOCKER
- HIGH
- MEDIUM
- LOW

# 9. 문서 vs 실제 코드 비교
최소 비교:
- `AGENTS.md`
- `docs/08_dev_roadmap.md`
- `docs/11_lobby_interaction_direction.md`
- `docs/14_cursor_handoff_update.md` (과거 개발 맥락 참고용)
- `docs/automation/**`

과거 문서를 이유로 현재 코드를 되돌리지 않는다.

# 10. 자동 검증
저장소에는 PR CI가 있으므로 가능하면 해당 결과로 다음을 확인한다.
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:visual`

실행하지 못한 항목은 추정하지 말고 미검증으로 표시한다.

# 11. M0 보고서 필수 형식
`docs/automation/M0_REENTRY_REPORT.md`

```md
# Coffee 2048 M0 Reentry Report
## 1. Executive Summary
## 2. 실제 구현 상태
### Puzzle
### Lobby
### Cafe Loop
### Customer
### Save
## 3. Asset Inventory
### 재사용 확정
### 보정 후보
### 교체 후보
### Legacy
### 실제 신규 필요
## 4. UI/UX 문제
### Blocker
### High
### Medium
### Low
## 5. 검증 결과
## 6. 문서와 코드의 차이
## 7. 리스크
## 8. 다음 마일스톤 제안
## 9. 추천 첫 자동개발 범위
## 10. 사용자 직접 확인이 필요한 것
```

---

# 완료 조건
M0는 코드를 개선했을 때가 아니라, **GPT가 현재 프로젝트를 정확히 이해해서 다음 개발 범위를 안전하게 결정할 수 있을 때** 완료다.
