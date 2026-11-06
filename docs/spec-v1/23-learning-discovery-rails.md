# 23. 추천 영상·교육 공고와 가로 레일

## 공통 컴포넌트

`learning-guide-section`은 학습 카드와 출처 카드를 `horizontal-rail`의 composition dependency로 렌더링한다. 가로 스크롤·마우스 드래그·클릭 억제는 기존 canonical rail이 소유한다. 레일의 `framed:false`는 외부 배경과 여백을 없애는 canonical 표시 옵션이다.

서로 다른 카드 본문은 부모 모듈의 `context.renderItem` 콜백으로 전달한다. 콜백은 공통 런타임 코드에만 존재한다. 저장된 JSON이나 원격 응답에서 HTML·함수·스크립트를 받지 않는다. 카드를 그리는 부모는 제목·설명·링크를 escape하고 허용된 URL만 렌더링한다.

`learning-resource-rail`은 다음 두 모듈을 required composition dependency로 사용한다.

- `horizontal-rail`: 스크롤과 드래그, 레일 geometry.
- `filter-chip-rail`: 필터 선택 상태, 이벤트, indicator와 motion.

부모는 필터 내부의 선택 색상이나 indicator를 다시 구현하지 않는다. `platform-filter-select` 이벤트로 표시할 자료만 바꾼다. Library, Editor, Public, dependency export가 같은 module ID와 owner를 소비한다. Library/Editor 예시는 명시적으로 예시라고 표시하며 원격 조회나 영구 저장을 하지 않는다. Portable consumer는 제공된 자료로 동작한다. 자동 수집 서비스는 호스팅 API가 있는 Public에서 `live:true`일 때만 실행한다.

## Public 사용 범위

사용자가 요청한 신규 분야의 가로 카드 적용에 따라 `horizontal-rail`의 Public 소비를 승인 범위에 포함한다. 적용 경로는 `/video/`, `/ai/`, `/community/`, `/real-estate/`, `/auction/`이며, `learning-guide-section`과 `learning-resource-rail`이 required composition dependency로 같은 rail을 사용한다.

사진 경로 `/`는 기존 10개 장을 유지한다. 사진 초기 페이지에 `portable-primitives-v1.js`를 연결하거나 범용 rail 본문을 추가하지 않는다. 기존 사진 설정의 `screen-mode-selector`와 `filter-chip-rail` 사용 범위는 유지한다. 범용 `accordion`과 `bottom-sheet`의 Public 소비는 이번 승인에 포함하지 않는다.

`scripts/check-library-runtime-feedback-v1.mjs`는 Registry의 승인 상태·소비자·부모 dependency, 사진 페이지의 primitive 미연결, 신규 5개 경로의 실제 rail 배치와 hydration을 검증한다. 승인되지 않은 accordion/bottom-sheet 소비자 또는 DOM이 생기면 실패한다.

## 배치와 저장

다섯 신규 분야의 교육 장에 공고 레일, 마지막 장에 영상 레일을 배치한다. 배치 설정은 `learning-pack-renderer.js`가 소유한다. 수집 결과는 편집 원고인 native Sheet와 구분하며, 원고 snapshot SHA를 변경하지 않는다.

자료 저장은 기존 `ContentBookmarkStore`와 기존 내 모음 저장 키를 쓴다. ID는 영상 `${packId}:video:${sourceId}`, 공고 `${packId}:notice:${sourceId}`로 구분한다. 자료 카드와 내 모음에서 어느 쪽으로 삭제해도 저장 상태를 다시 동기화한다.

## 영상 수집

`/api/learning-videos`는 등록된 분야별 12개 검색 주제와 공개 영상 metadata 색인을 함께 사용한다. `subject`, `topic`, `cursor`, `q`, `platform`만 받으며, 분야·주제·출처는 allowlist로 확인한다. 검색어는 최대 80자다. 제목·내용·채널·해시태그를 검색하며 사용자 입력 URL을 가져오지 않는다. 출처 필터는 전체, YouTube, Instagram이다.

YouTube는 공개 검색 페이지의 일반 영상, Shorts, 현대식 video lockup을 읽는다. 페이지가 제공한 실제 continuation이 있을 때만 같은 검색어의 다음 페이지를 조회한다. 주제당 최대 3페이지, 응답당 최대 18개로 제한하고 그다음 주제로 이동한다. 커서는 주제와 페이지의 위치를 나타내며 마지막 주제 이후에 처음으로 돌아가지 않는다. API 응답에는 외부 서비스의 continuation이나 client 설정을 내보내지 않는다.

검색 결과 HTML에 공개 WEB 설정만 있고 초기 결과가 없다면 동일 출처의 공개 검색 endpoint를 사용할 수 있다. 로그인·동의·bot 차단 화면 또는 차단 응답에서는 다른 endpoint를 재시도하지 않는다. 가져오기 시간은 요청당 7.5초, YouTube 본문은 최대 6 MiB, Instagram 본문은 최대 2 MiB다. redirect는 같은 origin 안에서 최대 2회만 허용하고 외부 origin으로는 따라가지 않는다. 로그인, 쿠키, 계정 정보, 영상 스트림을 수집하지 않는다.

Instagram은 확인된 개별 게시물의 공개 제목·캡션·해시태그를 색인한다. 사용자 제공 캡처에서 URL을 명확히 판독한 게시물만 넣으며, 불확실한 URL은 공개하지 않는다. `verification: provided-screenshot`과 확인일을 보존하고 자동 갱신 시에는 해당 게시물의 공개 Open Graph metadata만 읽는다. 한 응답에서 최대 4개 게시물을 다시 확인한다. 프로필 전체나 로그인 뒤의 게시물을 무제한으로 읽는 수집기는 아니다. 공개 metadata를 읽지 못하면 기존 캡처의 정보와 확인일을 남긴다. 영상 재생 여부, 팔로워 수, 문의·계약 성과를 추정하지 않는다. 캡처에 계약 완료가 표시된 자료는 촬영 구성을 참고하는 게시물로 구분한다.

`public/content-discovery/learning-videos.json`은 공개 페이지에서 확인한 초기 색인이다. `scripts/content/refresh-learning-video-index.mjs`는 이 색인의 YouTube metadata를 갱신하며, 실패한 주제의 이전 자료와 Instagram 확인 자료를 보존한다. 이 스크립트는 수동 실행 도구이며 주기 작업이 설치되었다는 뜻은 아니다. 채널명·조회수·게시일이 원문에 없으면 만들어 넣지 않고, metadata 확인을 영상 시청 확인으로 표시하지 않는다.

부동산의 검색 순서는 집 소개·촬영·짧은 룸투어·편집을 우선하고 실거래 조회·계약 서류는 뒤에 둔다. `featuredIds`는 초기 추천 순서를 유지하며, `excludedIds`는 교안과 관련이 낮다고 검토한 상품 추천·해외 자취 등의 영상이 갱신 중에 다시 들어오는 것을 막는다. 같은 ID의 최신 metadata는 기존 카드 위치에서 갱신한다.

서버 캐시는 최대 96개이며 성공 자료는 10분, 실패 응답은 2분간 재사용한다. 이전 성공 자료는 최대 24시간 보존하고 실패 후에도 원래 확인일을 유지한다. 분야 전체의 희소한 주제는 같은 분야의 확인한 자료로 보충할 수 있지만, 명시적인 주제·검색어 선택은 범위를 넓히지 않는다. 두 경우의 캐시와 continuation 상태를 분리한다. 실패 시에도 다음 주제 커서를 유지하며, 원인 코드는 timeout·크기 제한·차단·HTTP 오류·해석 실패 등을 구분한다.

사진 `/api/videos`와 기존 `video-discovery.js`의 검색·순위·응답 구현은 그대로 유지한다. 신규 검색 helper는 별도 파일 `learning-video-discovery.js`가 소유한다.

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

Public의 live 공고는 처음부터 결과 영역 32rem과 상태문 줄 높이를 확보한다. 카드와 빈 결과가 같은 영역을 사용하므로, 앞 장의 공고가 늦게 도착해도 뒤 장으로 이동 중인 목적지 높이를 바꾸지 않는다. 사진의 chapter-navigation을 수정하거나 이동을 다시 실행하지 않는다. 지연된 공고 응답을 사용한 최초 메뉴 클릭 검사에서 목적지의 위치와 선택된 장이 유지되는지 검증한다.

영상은 초기 색인에서 최대 12개를 먼저 보여주고, 실시간 검색 결과를 ID로 중복 제거해 합친다. Instagram 자료가 있는 분야의 전체 출처 화면은 초기 색인에 최대 4개를 섞어 보여준다. 가로 레일 끝에 가까워지면 다음 색인 12개와 다음 검색 페이지를 불러온다. `영상 더 보기` 버튼으로도 같은 작업을 할 수 있다. 카드가 늘어나지 않는 자동 요청은 연속 3회까지만 진행한다.

HTTP 실패는 기존 카드·커서를 지우지 않으며, 자동 재시도를 멈추고 `다시 불러오기`를 제공한다. 검색어·출처를 바꾸면 기존 요청을 취소하고 새 조건으로 시작한다. 늦게 도착한 이전 검색 결과는 새 조건의 화면을 덮어쓰지 않는다. 백그라운드 갱신은 이미 읽은 페이지 위치를 보존한다. 확인한 색인과 검색 주제를 모두 읽었으면 끝 상태를 보여주며 같은 카드를 다시 순환시키지 않는다.

카드의 해시태그 버튼은 해당 태그로 검색한다. 카드에는 원문에 있는 제목·채널·요약·게시 시점·조회수·길이를 표시한다. 없는 수치를 채우지 않는다. 이미지가 없는 Instagram 자료는 공통 placeholder로 표시하고 `게시물 보기`로 연결한다. Library·Editor·독립 export는 전달받은 전체 자료 안에서 같은 검색과 출처 필터를 사용하며 원격 조회 없이 동작한다.

## 검증

- 기존 사진 소유 파일·데이터와 본문 이동 동작 보존.
- canonical dependency graph와 소비자별 owner closure.
- 실제 HTML fixture의 접수기간, 원문 종료, 대기 접수, 상세 실패, KST 경계와 캐시 복구.
- 실제 UI의 지역/종류 조합, 빈 결과, 열린 페이지의 마감 전환, API 실패 후 이전 자료 보존.
- 일반 영상·Shorts·video lockup 파싱, 실제 continuation, 주제 종료, caption·해시태그 검색, 출처 allowlist와 원문 metadata 출처 보존.
- 검색 실패 후 색인·커서·마지막 성공 자료 보존, 주제 전체/명시적 주제 캐시 분리, 동시 요청 병합, 시간·크기·redirect 제한.
- 실제 UI의 가로 끝 자동 로드, ID 중복 제거, HTTP 실패 후 같은 커서 재시도, 마지막 페이지 종료, 출처·내용·해시태그 검색.
- 영상·공고의 내 모음 저장/삭제 동기화, 키보드 스크롤, 모바일 page overflow.
- Library 삽입, Editor 복제/JSON 내보내기·가져오기, 독립 dependency consumer와 밝은/어두운 화면.

CI의 고정 API fixture는 위 동작을 재현하기 위한 자료다. 실제 외부 API의 가용성은 배포 preview와 production에서 별도로 확인한다.
