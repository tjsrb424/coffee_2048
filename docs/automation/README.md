# Coffee 2048 Automation

Coffee 2048을 기존 구현 위에서 이어 개발하기 위한 자율개발 운영 문서 모음이다.

## 읽는 순서

1. `PROJECT_RULES.md`
   - 재사용 우선, 자율개발 범위, 중단 조건, 무료 원칙
2. `DEV_QUEUE.md`
   - 지금 AI가 어디까지 작업 가능한지
3. `ROADMAP.md`
   - M0 이후 마일스톤 구조
4. `CURSOR_EXECUTION_PROFILE.md`
   - Cursor 모델/모드 선택 규칙
5. `M0_REENTRY_AUDIT.md`
   - 첫 재인수 점검 절차
6. `M0_CURSOR_HANDOFF.md`
   - 바로 붙여넣을 수 있는 M0 Cursor 전달문

## 현재 상태

`M0 — 프로젝트 재인수`가 ACTIVE다.

M0가 끝날 때까지 제품 코드 기능 개발은 진행하지 않는다.

## 운영 방식

사용자는 M0 이후 다음처럼 범위를 승인할 수 있다.

```text
M1만 구현해.
```

```text
M1~M3까지 구현해서 플레이 가능한 상태로 보고해.
```

승인된 범위 안에서는 PROJECT_RULES의 AUTO 항목을 AI가 스스로 판단한다.

핵심 게임 루프/세이브 파괴/대규모 구조 변경은 자동 승인 범위가 아니다.
