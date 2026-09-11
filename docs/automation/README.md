# Coffee 2048 Automation

Coffee 2048을 기존 구현 위에서 이어 개발하기 위한 **GPT 중심 자율개발 운영 문서**다.

## 실행 주체
이번 자동개발의 실행 주체는 Cursor가 아니라 **ChatGPT/GPT**다.

GPT가 연결된 GitHub 저장소를 직접 읽고, 승인된 범위 안에서 브랜치/코드/UI/UX/자산/PR까지 작업한다.
Cursor는 이번 자동개발 파이프라인의 필수 요소가 아니다.

## 읽는 순서
1. `PROJECT_RULES.md`
   - GPT-only, 재사용 우선, 품질 우선, 자율개발 범위, 중단 조건, 무료 원칙
2. `DEV_QUEUE.md`
   - 지금 GPT가 어디까지 작업 가능한지
3. `ROADMAP.md`
   - M0 이후 마일스톤 구조
4. `GPT_WORKFLOW.md`
   - GPT가 실제로 개발하는 실행 흐름
5. `M0_REENTRY_AUDIT.md`
   - GPT가 직접 수행하는 첫 재인수 점검 절차

## 현재 상태
`M0 — 프로젝트 재인수`가 ACTIVE다.

M0가 끝날 때까지 제품 코드 기능 개발은 진행하지 않는다.
GPT가 직접 저장소를 분석하고 `M0_REENTRY_REPORT.md`를 작성한다.

## 운영 방식
M0 이후 사용자는 다음처럼 범위를 승인한다.

```text
M1만 구현해.
```

```text
M1~M3까지 구현해서 플레이 가능한 상태로 보고해.
```

승인된 범위 안에서는 PROJECT_RULES의 AUTO 항목을 GPT가 스스로 판단한다.

핵심 게임 루프 변경, 세이브 파괴, 대규모 구조 변경은 자동 승인 범위가 아니다.
