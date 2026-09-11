# Coffee 2048 — GPT Autonomous Development

Coffee 2048을 기존 구현 위에서 ChatGPT/GPT가 직접 이어 개발하기 위한 운영 문서 모음이다.

## 실행 주체

- ChatGPT/GPT
- connected GitHub
- GitHub Actions for non-AI validation

Cursor는 이 자동개발 체계의 실행 주체가 아니다.
기존 저장소의 Cursor 관련 문서는 과거 개발 이력/참고 문서로만 보존한다.

---

## 읽는 순서

1. `PROJECT_RULES.md`
   - 자율개발 안전 규칙
   - Reuse First + Quality Wins
   - Decision Gate
2. `DEV_QUEUE.md`
   - 현재 완료/대기/승인 가능한 작업 범위
3. `ROADMAP.md`
   - M0 결과를 반영한 현재 실행 roadmap
4. `GPT_WORKFLOW.md`
   - GPT가 GitHub에서 직접 개발하는 방식
5. `M0_REENTRY_REPORT.md`
   - 실제 현재 코드/화면/자산/CI 재인수 결과
6. `M0_REENTRY_AUDIT.md`
   - M0에서 사용한 audit checklist

---

## 현재 상태

- `M0 — 프로젝트 재인수`: **DONE**
- `M1 — 1.0 기준선 복구 및 Source-of-Truth 정렬`: **READY**
- 추천: **M1만 먼저 구현**

M0 핵심 결론:

- Coffee 2048은 다시 만들 프로젝트가 아니다.
- 1.0 기능 구조는 이미 상당히 구현되어 있다.
- 다음 작업은 최신 비주얼 UI와 실제 game-domain source를 정렬하고 regression baseline을 복구하는 것이다.

---

## 이미지 정책

기존 asset을 먼저 확인한다.

다만 다음과 같이 품질 향상이 명확하면 GPT가 신규 이미지를 제작/적용할 수 있다.

- 해상도
- 시각적 일관성
- 모바일 가독성
- 제품 정체성
- 상업적 완성도

기존 원본은 즉시 삭제하지 않는다.

---

## 사용 예

```text
M1 진행해.
```

GPT는 승인 범위 안에서 필요한 코드/UI/UX/test/asset 작업을 직접 세분화해 진행하고 PR/검증 결과까지 보고한다.
