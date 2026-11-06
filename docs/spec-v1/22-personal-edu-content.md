# 22. Personal Edu 콘텐츠 원본과 snapshot

영상·AI 활용·커뮤니티·부동산·경매의 편집 원본은 분야별 native Google Sheets다. 검증한 원고를 이 저장소의 JSON snapshot으로 복원하고, 공통 빌더가 공개 content pack을 만든다.

이 문서는 데이터 형식과 동기화 절차를 정의한다. 분야별 본문, 사진 페이지의 확정 카피, 이미지 생성 절차는 해당 원본과 기존 계약을 따른다.

## EDU-CONTENT-001 — 원본 위치

새 세션에서는 프로젝트 Drive의 `00_프로젝트운영/PROJECT_INDEX.json`을 읽는다. 같은 운영 폴더의 `edu-sheets-manifest.json`과 `Personal Edu Project_콘텐츠원본연결안내.md`에서 분야별 Sheet와 검증 범위를 찾는다.

비공개 Sheet ID, Drive 폴더 ID, 연결 URL, 인증 정보, 원본 API 응답은 Git에 넣지 않는다. 이 저장소에는 공개 교육 원고, 변환 도구, 기술 명세와 공개 가능한 검증 해시만 보관한다.

기존 사진 분야는 종전 Sheet와 데이터 파이프라인을 유지한다. 아래 형식은 신규 다섯 분야의 원본에 적용한다.

| 분야 ID | 공개 경로 | snapshot |
| --- | --- | --- |
| `video` | `/video/` | `content/learning-guides/v1/video.json` |
| `ai` | `/ai/` | `content/learning-guides/v1/ai.json` |
| `community` | `/community/` | `content/learning-guides/v1/community.json` |
| `real-estate` | `/real-estate/` | `content/learning-guides/v1/real-estate.json` |
| `auction` | `/auction/` | `content/learning-guides/v1/auction.json` |

## EDU-CONTENT-002 — 네 개의 탭

| 탭 | 역할 | 수정 위치 |
| --- | --- | --- |
| 안내 | 원본 편집법, 분야명, 검토일, 페이지 경로 | 원고 값은 콘텐츠 탭에서 수정 |
| 목차 | 장별 메뉴·제목·설명·결과물 | 콘텐츠 값을 조회하는 수식 |
| 콘텐츠 | JSON의 모든 구조와 값 | C열의 값 |
| 출처 | 자료명·기관·확인일·상태·설명·공식 URL | 콘텐츠 값을 조회하는 수식 |

콘텐츠 탭의 열은 다음과 같다.

| 열 | 값 | 규칙 |
| --- | --- | --- |
| A | JSON Pointer 경로 | 문구만 고칠 때는 유지한다. 같은 경로는 한 번만 둔다. |
| B | `object`, `array`, `string`, `number`, `boolean`, `null` | 기존 자료형을 유지한다. |
| C | 원고 값 | 문자열, 숫자, 불리언을 각각 원래 자료형으로 입력한다. |
| D | 분야·챕터·블록 위치 | 편집을 돕는 설명이다. JSON 복원에서는 읽지 않는다. |

첫 행은 제목 행이다. 데이터는 2행부터 읽는다. 루트의 A셀은 빈 문자열이며 B셀은 `object`다. 따라서 A셀이 비었다는 이유로 루트 행을 제거하면 안 된다.

`object`와 `array` 행은 빈 객체·빈 배열과 중첩 구조를 보존한다. 이 행들의 C셀은 비워둔다. `null`도 C셀을 비우지만 B열 자료형으로 구분한다. 빈 문자열은 `string`과 빈 C셀로 표현한다.

경로의 `/`는 `~1`, `~`는 `~0`으로 기록한다. 배열 원소는 0부터 시작하는 연속된 인덱스를 쓴다. 행 순서가 달라져도 경로를 기준으로 복원한다. 배열 원소의 순서는 인덱스를 따른다.

콘텐츠에는 제목 행과 A·B열 고정, 사용 범위의 필터를 적용한다. 목차와 출처의 수식은 콘텐츠 경로를 조회한다. 구조 행을 추가·삭제하면 수식 범위와 읽기 범위도 갱신한다.

## EDU-CONTENT-003 — 공개 JSON 형식

최상위 `schemaVersion`은 현재 `1`이다. 각 과정은 아래 필드를 가진다.

| 필드 | 형식과 의미 |
| --- | --- |
| `id`, `label`, `route` | 분야 ID, 표시명, 공개 경로 |
| `title`, `description` | 페이지 제목과 검색·공유 설명 |
| `reviewedAt` | 공개 원고 검토일 `YYYY-MM-DD` |
| `hero` | `eyebrow`, `title`, `description`, `facts` |
| `hero.facts[]` | `label`, `value`로 구성한 요약 항목 |
| `chapters[]` | 페이지 순서대로 표시할 장 |
| `sources[]` | 공식 자료와 확인 기록 |

각 장은 `id`, `label`, `title`, `description`, `outcome`, `sourceIds`, `blocks`를 가진다. `id`는 분야 안에서 고유해야 한다. `sourceIds`의 값은 같은 과정의 `sources[].id`와 연결한다.

V1의 다섯 과정은 각각 9개 장으로 구성했다. 장의 수와 순서는 분야 원본이 소유한다. 공통 렌더러가 사진 분야의 목차를 새 분야에 강제로 적용하지 않는다.

| 블록 `type` | 주요 필드 |
| --- | --- |
| `prose` | `title`, 문단 배열 `body` |
| `cards` | `title`, 카드 배열 `items`; 카드의 `eyebrow`, `title`, `body`, `bullets`, `meta`, `link` |
| `steps` | `title`, 단계별 `title`, `body`, `output`을 가진 `items` |
| `checklist` | 고유 `id`, `title`, 문자열 배열 `items` |
| `template` | 고유 `id`, `title`, 복사할 여러 줄 `text` |
| `table` | `title`, `columns`, 동일한 열 수의 `rows`, 선택 `caption` |
| `callout` | `title`, `body`, `tone` |
| `related` | `title`, `label`과 실제 내부 `url`을 가진 `items` |

체크리스트와 양식 ID에는 분야 접두사를 붙인다. 제목과 양식의 의미 있는 줄바꿈은 문자열의 `\n`으로 보존한다. 원고 문자열에 실행 코드나 HTML을 넣지 않는다.

출처는 `id`, `title`, `publisher`, `url`, `checkedAt`, `description`을 가진다. `kind`, `status`, `note`는 자료의 성격과 시점·조건을 설명한다. 교육 공고의 접수 기간과 현재 잔여석을 구분한다. 가격·법률·제도·제품 기능 등 변동 정보는 공식 원문과 확인일을 함께 갱신한다.

이미지 경로와 대체 텍스트는 현재 `scripts/build-personal-edu.mjs`가 공개 pack을 만들 때 연결한다. 공통 히어로의 `layout`과 모바일 이미지 초점(`mobileImageFocus`, 0~100)도 이 단계에서 연결하는 표시 설정이다. 공통 모듈이 같은 props를 받아 Library·Editor·Public·독립 소비자에서 렌더링한다. 원본 snapshot에 표시 설정을 임시로 덧붙인 뒤 원고 SHA를 바꾸지 않는다. 공개 데이터의 캐시 버전은 표시 설정을 포함한 생성 데이터에서 계산한다. 이미지 URL의 버전 쿼리도 실제 WebP SHA-256에서 계산한다. 이미지 제작과 검증은 기존 이미지 파이프라인 계약을 따른다.

## EDU-CONTENT-004 — Sheet 읽기

1. Drive 운영 인덱스에서 원본을 찾는다.
2. Sheet metadata로 제목과 네 개 탭을 확인한다.
3. 비공개 manifest에서 각 분야의 `contentRange`, `rowCount`, 원본 상태를 읽는다.
4. `sheet_name: "콘텐츠"`, `range: "A2:C마지막행"`, `value_render_option: "UNFORMATTED_VALUE"`로 읽는다.
5. 긴 범위는 겹치거나 빠지는 행 없이 연속된 구간으로 나눈다.
6. 각 응답의 `values`를 구간 순서대로 이어 붙인다.
7. 읽은 행 수를 manifest와 비교한다.

읽기 응답은 저장소 밖의 임시 작업 폴더에 보관한다. 예를 들어 `/tmp/personal-edu-source/video.rows.json`에 제목 행을 제외한 행 배열을 저장한다.

숫자 `0`과 불리언 `false`는 실제 값이다. 빈 셀을 채울 때 `value || ''`로 바꾸면 두 값이 손실된다. 변환 도구는 `value ?? ''`를 사용한다. 날짜처럼 문자열로 보관한 값은 문자열 상태를 유지한다.

CLI는 행 배열, Sheets의 `{ "values": [...] }`, 커넥터의 `{ "structuredContent": { "values": [...] } }`를 받는다. 여러 구간을 읽었다면 `values` 배열을 합친 뒤 넘긴다. D열이 포함되어 있어도 복원에는 A·B·C열만 사용한다.

## EDU-CONTENT-005 — 로컬 변환 도구

`scripts/content/learning-sheet-codec.mjs`는 Node.js 기본 모듈만 사용한다. 네트워크, 인증 정보, Google API를 사용하지 않는다.

```sh
node scripts/content/learning-sheet-codec.mjs --help
node scripts/content/learning-sheet-codec.mjs restore /tmp/personal-edu-source/video.rows.json /tmp/personal-edu-source/video.json
node scripts/content/learning-sheet-codec.mjs verify /tmp/personal-edu-source/video.rows.json /tmp/personal-edu-source/video.json
node scripts/content/learning-sheet-codec.mjs hash /tmp/personal-edu-source/video.json
```

`restore`는 2칸 들여쓰기, UTF-8, 마지막 줄바꿈이 없는 JSON을 만든다. 초기 검증 snapshot과 같은 바이트 형식이다. `unflatten`은 `restore`의 별칭이다.

`verify`는 모든 경로·자료형·값을 복원해 snapshot과 비교한다. `contentMatches: true`는 JSON 내용이 같다는 뜻이다. `byteIdentical: true`는 복원 형식까지 같다는 뜻이다. 내용이 달라지면 종료 코드 1을 반환한다. 바이트가 다르면 키 순서와 줄바꿈 형식을 조사한 뒤 SHA를 기록한다.

`snapshotSha256`은 입력 snapshot의 바이트 해시다. `restoredSha256`은 복원한 바이트 해시다. `canonicalSha256`은 객체 키 순서를 정규화한 내용 해시다. 문구 변경 여부와 직렬화 차이를 구분할 때 사용한다.

역방향 변환은 `flatten`으로 실행한다.

```sh
node scripts/content/learning-sheet-codec.mjs flatten content/learning-guides/v1/video.json /tmp/personal-edu-source/video.rows.json
```

`flatten`은 로컬 행 파일만 만든다. Sheet 원본 수정이나 업로드를 자동으로 실행하지 않는다. 새 워크북을 만들 때는 기존 스프레드시트 제작 절차로 XLSX를 준비하고 native Sheets로 가져온다.

도구는 중복 경로, 잘못된 경로 이스케이프, 누락된 부모 구조, 비연속 배열, 자료형 불일치, 구조 행에 입력된 값을 오류로 처리한다. 문자열을 숫자나 불리언으로 자동 변환하지 않는다. 입력과 출력에 같은 파일 경로를 지정하면 덮어쓰기를 거부한다.

## EDU-CONTENT-006 — 검증과 빌드

원고 변경은 Sheet에서 시작한다. 최신 원문과 `COPY_GUIDE`를 적용한 뒤 전체 범위를 다시 읽는다.

1. 복원한 JSON을 원본 전체 행과 대조한다.
2. 분야 ID·경로, 장 ID 중복, 출처 참조, 표의 열 수, 내부 링크, 양식·체크리스트 ID를 확인한다.
3. 원고에 없는 개인정보나 비공개 전략이 들어오지 않았는지 확인한다.
4. 검증한 파일을 `content/learning-guides/v1/<id>.json`으로 복사한다.
5. snapshot SHA와 확인 시각을 기록한다.
6. 공개 pack을 빌드한다.

```sh
cp /tmp/personal-edu-source/video.json content/learning-guides/v1/video.json
node scripts/content/learning-sheet-codec.mjs verify /tmp/personal-edu-source/video.rows.json content/learning-guides/v1/video.json
node scripts/build-personal-edu.mjs
```

빌더가 만드는 결과는 다음과 같다.

| 경로 | 결과 |
| --- | --- |
| `public/content-packs/<id>/pack.js` | 분야 등록과 목차 구성 |
| `public/content-packs/<id>/data/course.js` | 공통 런타임의 데이터 snapshot |
| `public/content-packs/<id>/data/course.json` | 이미지가 연결된 공개 데이터 |
| `public/<id>/index.html` | 분야 진입 페이지와 검색·공유 metadata |
| `public/content-packs/personal-edu-manifest.json` | 원본 snapshot SHA, 장·블록·출처 수 |

`content/learning-guides/v1/source-provenance.json`에는 각 분야의 `id`, `snapshotSha256`, `verifiedAt`, `sourceKind`만 기록한다. `sourceKind`는 `native-google-sheets`다. 실제 snapshot 파일의 SHA, 공개 manifest의 `sourceSha256`, provenance의 `snapshotSha256`이 모두 같아야 한다.

`verifiedAt`은 원본 readback과 snapshot을 대조한 시각이다. 빌드만 다시 실행했다고 이 시각을 갱신하지 않는다. 원문 확인과 원본 동기화를 마친 변경에서 갱신한다.

빌드 뒤에는 분야 경로와 공통 컴포넌트의 기능을 검증한다. 해당 작업의 필수 회귀 검사와 결과는 활성 workstream의 `TASKS.md`, `HANDOFF.md`에 기록한다. 이 변환 도구의 성공은 배포나 브라우저 동작의 검증을 대신하지 않는다.

## EDU-CONTENT-007 — 최초 원본 검증

2026-11-06에 신규 다섯 원본을 native Sheets로 저장했다. 45개 장, 출처 기록 48개, 전체 경로 행 3,655개를 확인했다. 이 가운데 원고 값 행은 2,680개이며 나머지는 객체·배열 구조 행이다.

전체 원본을 `UNFORMATTED_VALUE`로 다시 읽고 초기 원고와 대조했다. native Sheets를 XLSX로 재수출한 결과에서도 전체 값을 확인했다. 안내·목차·콘텐츠·출처 탭의 한글, 줄바꿈과 공식 URL을 렌더링으로 검토했다.

자세한 증거, 비공개 원본 연결과 실제 범위는 Drive의 `edu-sheets-manifest.json`에 남긴다. 원본 Sheet의 수정만으로 공개 페이지가 즉시 바뀌지는 않는다. 검증과 snapshot 빌드를 마친 뒤 배포 절차를 이어간다.
