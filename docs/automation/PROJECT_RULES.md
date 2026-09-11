# Coffee 2048 — GPT Autonomous Development Rules

## 목적

Coffee 2048을 기존 구현 위에서 안전하게 이어 개발하기 위한 GPT 전용 운영 규칙이다.

핵심 원칙:

> **기존 구현/자산을 먼저 이해하고 재사용하되, 승인된 마일스톤 안에서는 GPT가 코드·UI·UX·테스트·자산을 스스로 세분화해 완료 상태까지 진행한다. 품질 향상이 명확하면 이미지 신규 제작/교체도 허용한다.**

---

## 1. 제품 정체성

Coffee 2048은:

- 손맛 있는 2048 퍼즐
- 차분한 카페 운영
- 손님 관계/애정도 메타
- 감성적이고 저자극인 UI/UX

를 결합한 web-first 게임이다.

핵심 흐름:

`퍼즐 → 원두/보상 → 로스팅 → 메뉴 제작/진열 → 판매 → 코인/애정도 → 성장`

---

## 2. 실행 주체

이 자동개발 체계의 실행 주체는 ChatGPT/GPT다.

GPT가 connected GitHub를 직접 사용해:

- 저장소 분석
- branch 생성
- 코드 수정
- UI/UX 수정
- 필요 시 이미지 생성/적용
- test 수정/추가
- GitHub Actions 확인
- commit / PR
- 완료보고

를 수행한다.

Cursor나 별도 외부 code agent 전달은 필수가 아니다.

---

## 3. REUSE FIRST, QUALITY WINS

새 기능/UI/이미지/data structure를 만들기 전에 반드시 기존 구현을 검색한다.

우선 확인:

- `src/features/puzzle2048/**`
- `src/features/lobby/**`
- `src/features/meta/**`
- `src/features/customers/**`
- `src/stores/**`
- `src/data/**`
- `data/**`
- `image/**`
- `public/**`
- `locale/**`
- `docs/**`

### 금지

- 기존 puzzle engine을 확인하지 않고 새로 만드는 것
- 기존 lobby를 확인하지 않고 새로 만드는 것
- 기존 domain store를 무시하고 UI 전용 가짜 state를 늘리는 것
- 기존 음료 이미지를 보지도 않고 같은 메뉴를 다시 생성하는 것
- 오래돼 보인다는 이유만으로 asset을 삭제하는 것

### 이미지/asset 판정

- `REUSE` — 그대로 사용
- `POLISH` — 보정 후 사용
- `REPLACE` — 기존 것을 보존하면서 신규 품질 버전으로 교체
- `LEGACY` — 현재 runtime 미사용, 삭제는 별도 판단
- `NEEDED` — 기존에 목적에 맞는 asset이 없음

### 신규 이미지 허용 조건

아래에서 의미 있는 품질 향상이 있을 때 GPT가 신규 이미지를 생성/적용할 수 있다.

- 해상도/선명도
- 화면 간 스타일 일관성
- 제품 정체성
- 모바일 가독성
- 상업적 완성도
- 기존 CSS placeholder를 실제 illustration으로 교체할 가치가 큼

기존 원본은 검증 전 즉시 삭제하지 않는다.

---

## 4. SOURCE OF TRUTH 우선

UI가 예뻐도 실제 게임 규칙과 다르면 완료가 아니다.

다음 순서로 구현한다.

1. 현재 domain/store/economy source 확인
2. UI가 보여주는 의미 확인
3. 둘이 다르면 기존 1.0 mechanics를 기본값으로 유지
4. UI를 실제 mechanics에 맞춤
5. mechanics 자체를 확장해야 하면 Decision Gate 판단

특히:

- craftability
- material counts
- sale state
- customer state
- recipe ownership
- save/offline state

는 화면 내부 상수보다 store/domain을 우선한다.

---

## 5. 자율 개발 범위

사용자가 `M1 진행`, `M1~M2 진행`처럼 승인하면 해당 범위 안에서는 사소한 질문 없이 진행한다.

### AUTO

- 필요한 component 추가
- state display 연결
- loading / empty / disabled / error state
- mobile/touch UX
- micro interaction
- small safe refactor
- type 정리
- test 추가/갱신
- accessibility/layout 보정
- asset reuse/polish
- 명확한 품질 개선을 위한 신규 image 적용
- lint/type/build/test 오류 수정

### REVIEW AFTER IMPLEMENTATION

- 주요 화면 UX 구조 변경
- sale experience 변경
- growth presentation
- customer presentation
- core asset replacement

이 범주는 승인 마일스톤 안에서 구현할 수 있으나 완료 후 사용자 플레이 검수를 명확히 요청한다.

### STOP / DECISION REQUIRED

- core gameplay loop 변경
- save compatibility 파괴
- offline economy semantics 변경
- 대규모 state/architecture 교체
- 주요 콘텐츠 대량 삭제
- 1.0 release scope를 넘어서는 큰 feature 추가
- 유료 외부 API/service 필요

---

## 6. 현재 1.0 범위 존중

현재 자동개발은 `docs/release_scope_1_0.md`의 최신 경계를 우선한다.

1.0에 이미 들어간 축은 재구현하지 않는다.

1.0 밖인:

- order system
- special beans mechanics
- expanded guest meta
- season/event
- broader BM

는 사용자가 명시적으로 post-1.0 작업을 승인하기 전까지 자동 추가하지 않는다.

---

## 7. 무료 개발 원칙

별도 과금이 발생하는 외부 AI/API를 자동 호출하지 않는다.

허용:

- 현재 ChatGPT/GPT 제품 기능
- connected GitHub
- Git/GitHub 기본 기능
- GitHub Actions의 project validation
- 기존 Node/Next/Playwright/ESLint/TypeScript 도구

유료 API key/외부 service가 필요하면 멈추고 보고한다.

---

## 8. 변경 안전성

- 의미 있는 작업은 별도 branch
- unrelated refactor 금지
- save schema 변경은 migration 검토 필수
- secret/env commit 금지
- 기존 문서/asset 대량 삭제 금지
- 자동 merge 금지

---

## 9. 기본 검증 게이트

최소:

```bash
npm run lint
npm run typecheck
npm run build
npm run test:visual
```

UI copy/layout 변경으로 테스트가 stale해졌다면 테스트를 삭제하지 않는다.

- UI selector/copy는 최신 화면에 맞춤
- state/persistence/economy assertion은 최대한 유지

빌드/검증 실패 상태를 `DONE`으로 보고하지 않는다. 단, 기존 baseline에 이미 존재한 실패라면 정확히 구분해 보고한다.

---

## 10. 사용자 검수 지점

자동화가 대체하지 않는 것:

- 퍼즐 손맛
- 재미
- 감정 전달
- 화면 밀도/답답함
- 판매/성장 체감
- 카페 감성

완료보고에 `직접 플레이 검수 항목`을 반드시 넣는다.

---

## 11. 완료보고

```md
# 완료 보고
## 목표
## 구현 완료
## 재사용한 기존 코드/자산
## 신규/교체 자산
## 변경 파일
## 검증
- lint:
- typecheck:
- build:
- Playwright:
## 직접 플레이 검수 항목
## 리스크 / 미확인
## 다음 추천 작업
```
