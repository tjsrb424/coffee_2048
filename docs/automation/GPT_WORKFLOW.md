# Coffee 2048 — GPT-Only Development Workflow

## 목적

Coffee 2048 자동개발의 실행 주체는 ChatGPT/GPT다.
사용자가 승인한 마일스톤 범위 안에서 GPT가 connected GitHub를 직접 사용해 분석, 구현, 검증, PR, 보고까지 진행한다.

---

## 기본 흐름

사용자 지시 예:

```text
M1 진행해.
```

또는:

```text
M1~M2까지 개발하고 보고해.
```

GPT는:

1. `PROJECT_RULES.md`, `DEV_QUEUE.md`, `ROADMAP.md` 확인
2. current main/target branch 확인
3. 기존 코드/UI/이미지 검색
4. 작업 branch 생성
5. 승인 범위 세분화
6. domain source-of-truth 먼저 확인
7. 코드 구현
8. 필요한 UI/UX 구현
9. 기존 asset 비교
10. 품질 향상이 명확하면 신규 이미지 생성/적용
11. regression test 추가/수정
12. GitHub Actions 실행
13. 실패 원인 수정
14. commit/PR 생성 또는 기존 PR 갱신
15. 완료보고

---

## 현재 단계

M0 재인수는 완료됐다.

결과:

- `docs/automation/M0_REENTRY_REPORT.md`

다음 권장 단계:

- `M1 — 1.0 기준선 복구 및 Source-of-Truth 정렬`

M1에서는 새 콘텐츠를 만들지 않고 현재 최신 UI와 실제 game-domain state를 일치시키고 CI를 복구한다.

---

## GPT의 자율 판단 범위

승인 마일스톤 안에서 별도 질문 없이 진행 가능:

- component 추가/정리
- current UI state 연결
- loading/empty/disabled/error state
- responsive/mobile UX
- micro interaction
- small safe refactor
- test 추가/수정
- asset reuse/polish
- 품질 향상이 명확한 신규 이미지 생성/적용
- lint/type/build/test 오류 수정

---

## Decision Gate

다음은 자동 진행하지 않는다.

- core gameplay loop 변경
- save compatibility 파괴
- offline economy semantics 변경
- 대규모 architecture replacement
- 주요 콘텐츠 대량 삭제
- 승인 마일스톤을 넘어서는 feature
- 유료 외부 API/service 필요

이 경우:

```md
# DECISION REQUIRED
## 현재 작업
## 문제
## 선택지
## 추천
## 영향
```

형식으로 사용자에게 보고한다.

---

## 검증

프로젝트 기존 CI를 우선 사용한다.

현재 기본 gate:

```bash
npm run lint
npm run typecheck
npm run build
npm run test:visual
```

Playwright가 UI copy/layout 변경으로 깨진 경우 테스트를 단순 삭제하지 않는다.
실제 state/persistence/economy assertion은 유지하고 현재 UI 계약만 갱신한다.

---

## 비용 원칙

GPT 자동개발 체계 자체에서 별도 OpenAI API key를 사용하지 않는다.

- ChatGPT/GPT: 현재 제품 기능
- GitHub connector: repo 작업
- GitHub Actions: 비-AI build/test

추가 과금 외부 AI/API가 필요해지면 자동 진행하지 않는다.
