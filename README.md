# Photo-eBook

모바일 우선 사진 수익화 로드맵 웹사이트입니다.

## 현재 구조

- `public/` — Cloudflare Pages 정적 프런트엔드
- `functions/api/[[path]].js` — 본문, 질문함용 Cloudflare Pages Function
- `functions/api/curated.js` — 외부 사진 글 큐레이션과 SEO 메타 파싱
- Google Sheets API — 기존 Google Sheet를 직접 읽고 씁니다.

Apps Script는 사용하지 않습니다.

## 자동 배포

`main` 브랜치에 push되면 Cloudflare Pages가 자동 배포합니다.

- Production branch: `main`
- Build output directory: `public`
- Root directory: 비워두기
- 현재 Cloudflare 프로젝트에서 `exit 0` Build command를 사용해도 됩니다.

## Cloudflare 환경 변수

Production 환경에 아래 두 값만 필요합니다.

- `GOOGLE_SHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON` — Secret으로 저장

서비스 계정 이메일에는 해당 Google Sheet를 편집자로 공유해야 합니다.

## 데이터 흐름

GitHub → Cloudflare Pages / Functions → Google Sheets API → Google Sheet

시트 내용을 수정하면 Git 배포 없이 다음 조회에서 바로 반영됩니다.
프런트엔드 또는 Function 코드를 수정하면 GitHub push 후 Cloudflare가 자동 배포합니다.

## 질문함

- OpenAI API를 사용하지 않습니다.
- 질문은 브라우저 localStorage와 `QUESTION_HISTORY` 시트에 함께 저장합니다.
- 로그인 서버 없이 브라우저별 임의 동기화 키를 사용합니다.
- `동기화 키 복사` 후 다른 기기에서 `다른 기기 연결`로 같은 질문 기록을 불러올 수 있습니다.
- 질문 삭제 시 로컬 기록과 Google Sheet 기록을 함께 정리합니다.

## 외부 사진 글 큐레이션

`CURATED_LINKS` 시트에서 브런치, 티스토리 등 사진 관련 링크를 관리합니다.

- 링크를 추가하면 `/api/curated`가 `og:title`, `og:description`, `og:image`, 작성자, 발행일을 읽어 카드 정보를 채웁니다.
- 이미지나 SEO 정보가 비어 있는 새 링크는 첫 조회 때 우선 보강합니다.
- 기존 링크는 마지막 확인 후 7일이 지나면 페이지 조회 시 백그라운드에서 다시 확인합니다.
- 웹의 `링크 새로고침` 버튼으로 현재 노출 링크를 수동 갱신할 수 있습니다.
- 카드 즐겨찾기는 브라우저 localStorage에 저장하며 `즐겨찾기만` 필터로 관리합니다.

`CURATED_LINKS` 주요 컬럼: `id`, `title`, `url`, `platform`, `author`, `published_at`, `summary`, `thumbnail_url`, `og_title`, `og_description`, `tags`, `reaction_text`, `manual_score`, `is_visible`, `sort_order`, `fetch_status`, `last_checked_at`.

## 보안

- 서비스 계정 JSON은 GitHub에 넣지 않습니다.
- Cloudflare의 encrypted Secret에만 저장합니다.
- 웹 브라우저에는 서비스 계정 키가 전달되지 않습니다.
