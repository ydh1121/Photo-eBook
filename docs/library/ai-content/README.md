# AI Content Library

산업 페이지를 만든 뒤 AI가 block 내용을 작성·검수하고 Editor에 안전하게 되돌리는 공통 계약이다.

문서:
- `AI-CONTENT-CONTRACT-V1.md` — page brief, AI 상태, block AI policy, evidence 계약
- `AI-CONTENT-RESPONSE-V1.md` — AI 결과 JSON과 lock-aware 적용 계약

기본 흐름:

`관리자 rough layout → AI 작업 JSON → AI 작성/검토 → AI 결과 JSON → Editor 안전 적용 → needs_review → 사용자 검토 → 서버 draft 저장`

특정 AI API에 종속되지 않는다. ChatGPT에서 직접 작업하더라도 같은 JSON 계약을 사용한다.
