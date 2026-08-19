# Platform Library V1 — Latest Addendum

이 파일은 `HANDOFF.md` 마지막 갱신 이후 추가된 작업만 기록한다. `main`에서 이 파일의 commit이 `HANDOFF.md`보다 최신이면 아래 상태를 추가로 반영해 재개한다.

## 2026-08-20 latest additions

### V1 completion target

Platform Library V1의 완료선은 Editor Lab 기능 구현 자체가 아니다.

완료 조건:
1. Block Lab에서 사용할 block을 실제 화면 기준으로 최종 판정하고 browser/server Registry에 반영
2. 배포 환경에서 Editor 인증, 저장, 불러오기, media, revision, AI review, publish-check, publish, rollback을 실제 QA
3. photography 외 신규 산업 페이지 1개를 `초안 → AI 작성 → 사용자 검수 → 발행 → snapshot preview → rollback draft → 재발행`까지 end-to-end 통과
4. approved block 기반 public snapshot renderer와 산업별 canonical URL 연결
5. public title/meta/canonical/OG/Twitter/JSON-LD/sitemap/real 404 적용
6. PC/mobile 실제 화면과 Core Web Vitals 검수
7. PC 좌우 광고 side rail을 넣어도 본문/가로 rail/모바일 구조가 무너지지 않는 ad-ready 상태 확인

AdSense 계정 승인, publisher ID처럼 외부 계정에 의존하는 값은 별도 external checkpoint로 남길 수 있다.

### Change-aware save

Canonical Editor write endpoint:
- `POST /api/editor/save-page`
- file: `functions/api/editor/save-page.js`

동작:
- 새 block → version 1 + revision
- 기존 block의 sort/type/variant/enabled/content/evidence/aiPolicy를 stable JSON 기준으로 비교
- 실제 변경된 block만 row update + revision_version 증가 + revision append
- 변경 없는 block은 block row update와 revision append를 생략
- 제거된 block은 `block removed` snapshot revision을 남긴 뒤 마지막에 row clear
- Editor server save와 publish pre-save 모두 `/save-page`를 사용

기존 catch-all `POST /api/editor/page`는 legacy compatibility용이며 Editor UI canonical write path가 아니다.

### Friendly inspector

추가:
- `public/assets/js/editor-lab/inspector-friendly.js`
- `public/assets/styles/editor-lab/inspector-friendly.css`

27개 block type마다 자주 수정하는 필드를 위쪽 `빠른 편집` 영역에 보여준다. 반복 배열/표/세부 객체는 기존 recursive inspector를 유지한다.

저장된 문자열을 quick editor HTML에 다시 넣을 때 HTML escape를 적용한다.

### Slug conflict

추가:
- `GET /api/editor/slug-check?slug=...&pageId=...`
- file: `functions/api/editor/slug-check.js`

`PLATFORM_PAGES`와 active `PUBLISH_SNAPSHOTS`를 확인해 다른 page가 같은 slug를 쓰는지 검사한다.

Editor:
- `page-meta.js`에서 server 연결 시 slug 사용 가능 여부 표시
- `publish-controls.js`가 publish pre-save 전에 slug conflict를 다시 확인

### Publish snapshot history / rollback draft

추가:
- `GET /api/editor/snapshots?pageId=...`
- `GET /api/editor/snapshots?pageId=...&snapshotId=...`
- file: `functions/api/editor/snapshots.js`

Editor:
- `public/assets/js/editor-lab/snapshot-history.js`
- `public/assets/styles/editor-lab/snapshot-history.css`

발행 기록을 version별로 조회하고, 과거 snapshot을 서버에 즉시 덮어쓰지 않고 browser draft로 복원한다. 복원 후 `aiStatus=needs_review`로 두고 다시 검토/저장/발행해야 한다.

추가 보완:
- 발행 기록의 각 version에 `미리보기`와 `초안으로 복원` 동작을 분리
- snapshot을 390 / 768 / 1180 폭으로 visual preview
- preview는 같은 Block Registry renderer를 사용
- preview 자체는 서버 draft나 active snapshot을 변경하지 않음
- `publish-controls.js`가 snapshot history CSS/JS를 로드하도록 연결
- `COPY_GUIDE`에 관리자 미리보기/복원 문구 기준 추가

### CI

추가:
- `.github/workflows/platform-library-checks.yml`

목표:
- browser/server Block Registry sync
- block/editor/Editor Functions JavaScript syntax check

현재 도구에서 GitHub Actions run 결과를 확정적으로 읽지 못했으므로 CI success는 검증 완료로 표시하지 않는다.

## Current external checkpoints remain

- `/block-lab/` 사용자 시각 검토 및 27개 block 판정
- Cloudflare `ADMIN_EDITOR_TOKEN` 설정
- `/editor-lab/` authenticated live save/load/media/revision/publish-check QA
- PC/mobile 실제 화면 QA

27개 block은 여전히 모두 `candidate`; 자동 승인하지 않는다.
