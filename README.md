# Photo-eBook

모바일 우선 사진 수익화 로드맵 웹사이트입니다.

## 구조

- `public/` — Cloudflare Pages에 배포되는 정적 프런트엔드
- `functions/api/[[path]].js` — 브라우저와 Apps Script 백엔드 사이의 동일 출처 프록시
- `apps-script/` — Google Sheet DB, 질문 기록, 이메일 OTP 백엔드
- `.github/workflows/deploy-apps-script.yml` — Apps Script 자동배포

## Cloudflare Pages 설정

Cloudflare Pages에서 GitHub 저장소를 연결하면 `main` 브랜치 push마다 자동 배포됩니다.

- Framework preset: None
- Build command: 비워두기
- Build output directory: `public`
- Root directory: 비워두기
- Production branch: `main`

환경 변수:

- `APPS_SCRIPT_API_URL`
  - `https://script.google.com/macros/s/AKfycbzBVn9oXNWbBVCKV46t_0j5qRJ26ao1gNJneIHIA1nm9EyNnYW-_Wa8FX_JI10_O1E6/exec`
  - 같은 Apps Script 배포를 업데이트하므로 이 URL은 그대로 유지합니다.

## Apps Script 자동배포

`apps-script/**`가 `main`에 변경되면 GitHub Actions가 기존 웹앱 배포를 업데이트하도록 구성되어 있습니다.

Repository secrets에 아래 두 값을 한 번만 등록합니다.

- `APPS_SCRIPT_ID` — Apps Script 편집기 → 프로젝트 설정 → 스크립트 ID
- `CLASPRC_JSON` — `clasp login` 후 생성되는 사용자 OAuth 인증 파일의 전체 JSON

배포 ID는 현재 웹앱 URL의 배포 ID를 workflow에 고정해 두었습니다.

최초 설정 후에는 `apps-script/` 변경 → GitHub Actions → 기존 Apps Script 배포 업데이트 순서로 자동 반영됩니다. 새 배포를 만들지 않으므로 `/exec` 주소를 Cloudflare에서 다시 바꿀 필요가 없습니다.

주의: `clasp push`는 Apps Script 프로젝트 소스를 `apps-script/` 폴더 내용으로 교체합니다. 이 프로젝트는 Cloudflare 프런트엔드 + Apps Script 백엔드 구조를 전제로 합니다.

## 질문함

- 로그인 없이 같은 브라우저에 localStorage 저장
- 허용 이메일은 Google Sheet `QUESTION_USERS`에서 관리
- 이메일 OTP 로그인 후 `QUESTION_HISTORY`에 동기화
- OpenAI API는 사용하지 않음
