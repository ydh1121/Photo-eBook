# 23. 추천 영상·교육 공고와 가로 레일

## 공통 컴포넌트

`learning-guide-section`은 학습 카드와 출처 카드를 `horizontal-rail`의 composition dependency로 렌더링한다. 가로 스크롤·마우스 드래그·클릭 억제는 기존 canonical rail이 소유한다. 레일의 `framed:false`는 외부 배경과 여백을 없애는 canonical 표시 옵션이다.

서로 다른 카드 본문은 부모 모듈의 `context.renderItem` 콜백으로 전달한다. 콜백은 공통 런타임 코드에만 존재한다. 저장된 JSON이나 원격 응답에서 HTML·함수·스크립트를 받지 않는다. 카드를 그리는 부모는 제목·설명·링크를 escape하고 허용된 URL만 렌더링한다.

`learning-resource-rail`은 다음 두 모듈을 required composition dependency로 사용한다.

- `horizontal-rail`: 스크롤과 드래그, 레일 geometry.
- `filter-chip-rail`: 필터 선택 상태, 이벤트, indicator와 motion.

부모는 필터 내부의 선택 색상이나 indicator를 다시 구현하지 않는다. `platform-filter-select` 이벤트로 표시할 자료만 바꾼다. Library, Editor, Public, dependency export가 같은 module ID와 owner를 소비한다. Library/Editor 예시는 명시적으로 예시라고 표시하며 원격 조회나 영구 저장을 하지 않는다. Portable consumer는 제공된 자료로 동작한다. 자동 수집 서비스는 호스팅 API가 있는 Public에서 `live:true`일 때만 실행한다.

## 배치와 저장

다섯 신규 분야의 교육 장에 공고 레일, 마지막 장에 영상 레일을 배치한다. 배치 설정은 `learning-pack-renderer.js`가 소유한다. 수집 결과는 편집 원고인 native Sheet와 구분하며, 원고 snapshot SHA를 변경하지 않는다.

자료 저장은 기존 `ContentBookmarkStore`와 기존 내 모음 저장 키를 쓴다. ID는 영상 `${packId}:video:${sourceId}`, 공고 `${packId}:notice:${sourceId}`로 구분한다. 자료 카드와 내 모음에서 어느 쪽으로 삭제해도 저장 상태를 다시 동기화한다.

## 영상 수집

`/api/learning-videos`는 등록된 분야·주제의 공개 YouTube 검색 결과를 파싱한다. 사용자 입력 URL을 가져오지 않는다. 검색 실패 시 `public/content-discovery/learning-videos.json`의 직접 확인한 영상 metadata를 표시하고 원래 확인 시각과 fallback 여부를 보존한다. 확인하지 못한 채널명·조회수·게시일은 만들어 넣지 않는다. Instagram 자동 수집은 현재 범위에 포함하지 않는다.

기존 사진 `/api/videos`는 공통 파서 추출 후에도 기존 검색·순위 규칙과 응답을 유지한다.

## 공식 공고 수집

`/api/learning-opportunities?subject=<id>&region=all&type=all`이 allowlist에 등록된 공식 기관 목록과 상세 HTML을 수집한다. 검색 조건은 분야, 지역(`all`, `busan`, `seo-gu`, `any`), 종류(`all`, `education`, `grant`)만 허용한다. `grant`의 표시명은 지원사업이며 현금 지급이나 개인의 신청 가능 여부를 뜻하지 않는다.

기술 수집 설정은 `content/discovery/v1/notices-sources.json`, 확인한 초기 자료는 `notices-bootstrap.json`과 공개 snapshot에 기록한다. 수집기는 제한된 시간·응답 크기·상세 개수·서브요청 수 안에서 동작한다. 외부 redirect도 기관 allowlist를 재검사한다.

접수기간과 수업기간은 별도 필드다. 날짜만 있는 마감일은 한국 시간 23:59:59까지로 해석한다. 상태는 다음 증거로 계산한다.

1. 접수 종료일 경과 또는 원문의 명시적 종료: 마감.
2. 접수 시작 전: 접수 예정.
3. 실제 접수 중 표기나 검증한 기간: 접수 중.
4. 상세 조회 실패·상태 불명·조건부 마감: 확인 중. 실패 자체를 마감으로 처리하지 않는다.

공식 페이지가 서로 다른 상태를 표시하면 상세 확인 여부를 보존한다. 상세를 읽지 못했는데 접수 중이라고 확정하지 않는다. 기관 단위의 이전 성공 결과와 확인 시각을 보존하고, 실패가 있는 응답은 부분 실패나 오래된 자료 상태를 전달한다. 관련 공고가 없으면 빈 결과를 허용한다.

## 화면 갱신

자료 레일이 화면 가까이 오면 초기 snapshot을 읽고 API를 조회한다. 공고는 페이지가 열린 동안 1분 간격으로 마감일을 다시 계산한다. 표시 중인 레일은 5분 간격으로 원문을 재확인하며, 탭 복귀와 새로고침 버튼도 갱신할 수 있다. 새 응답이 실패하면 기존 카드와 확인 시각을 남긴다. 현재 수집 결과를 한 번도 읽지 못한 경우에는 로딩 실패를 표시한다.

## 검증

- 기존 사진 소유 파일·데이터와 본문 이동 동작 보존.
- canonical dependency graph와 소비자별 owner closure.
- 실제 HTML fixture의 접수기간, 원문 종료, 대기 접수, 상세 실패, KST 경계와 캐시 복구.
- 실제 UI의 지역/종류 조합, 빈 결과, 열린 페이지의 마감 전환, API 실패 후 이전 자료 보존.
- 영상·공고의 내 모음 저장/삭제 동기화, 키보드 스크롤, 모바일 page overflow.
- Library 삽입, Editor 복제/JSON 내보내기·가져오기, 독립 dependency consumer와 밝은/어두운 화면.

CI의 고정 API fixture는 위 동작을 재현하기 위한 자료다. 실제 외부 API의 가용성은 배포 preview와 production에서 별도로 확인한다.
