# M0 Cursor Handoff — Coffee 2048 재인수

## Cursor 설정

- **Mode:** `Plan`
- **Model:** `GPT-5.5`
- **Reasoning:** `High`

M0는 분석 작업이므로 `Agent`가 아니라 `Plan`을 사용한다.

구현 단계에서는 **Composer2를 사용할 수 있다면 `Agent + Composer2 + Fast OFF`를 기본 구현 프로필로 사용**한다. 하지만 지금 M0에서는 코드를 수정하지 않는다.

---

## Cursor에 전달할 내용

```md
Coffee 2048 개발을 다시 시작한다.

이번 작업은 M0 프로젝트 재인수 Audit이다.
코드를 개발하거나 수정하지 말고 현재 프로젝트를 정확히 다시 이해하는 데 집중해라.

먼저 반드시 아래 문서를 읽어라.

- AGENTS.md
- docs/automation/PROJECT_RULES.md
- docs/automation/DEV_QUEUE.md
- docs/automation/ROADMAP.md
- docs/automation/M0_REENTRY_AUDIT.md
- docs/08_dev_roadmap.md
- docs/14_cursor_handoff_update.md
- 기존 .cursor/rules/**

중요 원칙:

1. Coffee 2048은 새로 만드는 프로젝트가 아니다.
2. 기존 퍼즐, 로비, 카페 운영 루프, 손님 메타를 최대한 보존한다.
3. 새 UI/이미지/시스템을 만들기 전에 반드시 같은 목적의 기존 구현을 검색한다.
4. image/drink, image/ui, public/assets 등 기존 자산을 먼저 전수 조사한다.
5. 기존 음료 이미지가 있으면 신규 생성 대상으로 잡지 않는다.
6. M0에서는 명백한 버그를 발견해도 고치지 말고 기록만 한다.
7. UI 리디자인, 구조 리팩터링, 자산 삭제를 하지 않는다.
8. 추가 과금이 드는 외부 AI/API를 사용하지 않는다.

실제 저장소를 기준으로 다음을 확인해라.

- 전체 route/screen
- puzzle2048 실제 구현 범위
- lobby 실제 구현 범위
- roaster/showcase/workbench/counter
- 퍼즐 → 보상 → 로비 → 로스팅 → 제작 → 판매 흐름
- meta/customer/affection/story 구조
- save/persistence/version/migration
- 이미지/아이콘/배경/폰트 inventory
- 현재 사용 중인 자산과 legacy/미사용 자산
- UI/UX blocker
- 모바일 UX
- docs와 실제 코드의 불일치

검증 가능한 환경이면 아래도 실행한다.

npm run lint
npm run typecheck
npm run build
npm run test:visual

테스트가 실패하면 M0에서는 고치지 말고 원인을 기록한다.

최종 결과는 다음 파일에 작성해라.

- docs/automation/M0_REENTRY_REPORT.md

보고서는 docs/automation/M0_REENTRY_AUDIT.md의 지정 형식을 따른다.

마지막에는 반드시 다음을 명확하게 추천해라.

- 현재 실제 완성도
- 그대로 재사용할 것
- 수정이 필요한 것
- 신규 제작이 실제로 필요한 것
- 가장 큰 blocker 3개
- 추천 첫 자동개발 범위 (예: M1만 / M1~M2)

다시 강조한다.
이번 작업에서는 분석 보고서 외의 제품 코드 수정은 하지 마라.
```

---

## M0 이후

M0 보고서를 사용자가 검수한 뒤에만 `DEV_QUEUE.md`의 다음 마일스톤을 ACTIVE로 변경한다.

예:

`M1~M2까지 구현` 승인 시

- Cursor Mode: `Agent`
- 기본 모델: `Composer2`
- Fast: `OFF`

복잡한 save/architecture 문제가 포함되면 해당 부분만:

- Cursor Mode: `Agent`
- Model: `GPT-5.5`
- Reasoning: `High`

으로 전환한다.
