# Coffee 2048 — Cursor Execution Profile

이 문서는 Coffee 2048 자동개발에서 Cursor의 **모델 / 모드 / reasoning 강도**를 작업 성격에 맞게 고정한다.

추가 API 과금 없이 현재 Cursor에서 사용할 수 있는 모델 범위 안에서 진행한다.

---

# 1. M0 재인수 Audit

## 권장 설정

- **Cursor Mode:** `Plan`
- **Model:** `GPT-5.5`
- **Reasoning:** `High`

## 이유

M0는 코드를 쓰는 단계가 아니라 기존 코드/문서/자산을 읽고 충돌을 찾는 작업이다.

`Extra High`까지 올릴 필요는 기본적으로 없다.
구조가 매우 복잡하거나 save migration/architecture 충돌을 해석해야 할 때만 Extra High를 일시적으로 사용한다.

---

# 2. 일반 기능 구현 / UI / UX

## 기본 권장 설정

- **Cursor Mode:** `Agent`
- **Model:** `Composer2`
- **Fast:** `OFF`

**Composer2를 사용할 수 있다면 Coffee 2048의 기본 구현 모델로 우선 사용한다.**

적합한 작업:

- UI 컴포넌트 구현
- UX 상태 추가
- 여러 파일을 연결하는 기능 개발
- 스타일 수정
- 기존 store/action 연결
- 승인된 마일스톤 범위의 반복 구현
- lint/typecheck/build 수정 루프

Fast를 끄는 이유:

- 기존 코드 재사용 여부를 더 신중하게 판단
- 여러 파일 수정 시 누락 감소
- UI/UX와 상태 연결 품질 우선

---

# 3. 구조적 기능 / 어려운 버그

## 권장 설정

- **Cursor Mode:** `Agent`
- **Model:** `GPT-5.5`
- **Reasoning:** `High`

적합한 작업:

- save/persistence
- migration
- 복잡한 상태 동기화
- puzzle/meta 연결 버그
- 다중 시스템 회귀
- 구조적으로 원인 추적이 필요한 버그

---

# 4. 큰 방향 결정 / 아키텍처 변경 검토

## 권장 설정

- **Cursor Mode:** `Plan`
- **Model:** `GPT-5.5`
- **Reasoning:** `Extra High`

이 프로필은 자주 쓰지 않는다.

사용 예:

- 기존 save 구조를 교체할지 결정
- 대규모 store architecture 변경
- 핵심 게임 루프 변경 검토
- 오래된 구현을 유지할지 폐기할지 비교

이 경우 Plan 결과를 사용자에게 먼저 보여주고 승인 전에는 Agent로 구현하지 않는다.

---

# 5. 간단한 확인 / 질문

## 권장 설정

- **Cursor Mode:** `Ask`
- **Model:** `GPT-5.5`
- **Reasoning:** `Medium`

사용 예:

- 특정 파일 역할 확인
- 특정 함수가 어디서 쓰이는지 확인
- 단순 오류 설명
- 변경 없이 코드 구조 질의

---

# 6. 모델 선택 요약

| 작업 | Cursor Mode | 모델 | 설정 |
|---|---|---|---|
| M0 프로젝트 Audit | Plan | GPT-5.5 | High |
| 일반 UI/UX/기능 구현 | Agent | Composer2 | Fast OFF |
| 복잡한 버그/상태/저장 | Agent | GPT-5.5 | High |
| 대규모 구조 결정 | Plan | GPT-5.5 | Extra High |
| 간단한 코드 질의 | Ask | GPT-5.5 | Medium |

---

# 7. 자동개발 원칙

모델이 강하다고 승인 범위를 넓히지 않는다.

모든 모델은 반드시:

1. `docs/automation/PROJECT_RULES.md`
2. `docs/automation/DEV_QUEUE.md`
3. 현재 활성 마일스톤 문서
4. 기존 `.cursor/rules/**`

를 따른다.

모델 선택은 구현 품질을 위한 것이며, 제품 결정 권한을 넓히는 것이 아니다.
