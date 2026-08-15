# Photo-eBook

모바일 우선 사진 수익화 로드맵 웹사이트입니다.

## 구조

- `public/` — Cloudflare Pages에 배포되는 정적 프런트엔드
- `functions/api/[[path]].js` — 브라우저와 Apps Script 백엔드 사이의 동일 출처 프록시
- `apps-script/Code.gs` — Google Sheet DB, 질문 기록, 이메일 OTP 백엔드

## Cloudflare Pages 설정

Cloudflare Pages에서 GitHub 저장소를 연결하면 `main` 브랜치 push마다 자동 배포됩니다.

- Framework preset: None
- Build command: 비워두기
- Build output directory: `public`
- Root directory: 비워두기
- Production branch: `main`

환경 변수:

- `APPS_SCRIPT_API_URL`
  - 기존 Google Apps Script 웹앱의 `/exec` URL

## Apps Script

`apps-script/Code.gs`를 기존 Apps Script 프로젝트의 `Code.gs`에 한 번 반영하고 새 버전으로 배포합니다.

이후 프런트엔드 수정은 GitHub에 push하면 Cloudflare Pages가 자동 배포합니다.

## 질문함

- 로그인 없이 같은 브라우저에 localStorage 저장
- 허용 이메일은 Google Sheet `QUESTION_USERS`에서 관리
- 이메일 OTP 로그인 후 `QUESTION_HISTORY`에 동기화
- OpenAI API는 사용하지 않음
