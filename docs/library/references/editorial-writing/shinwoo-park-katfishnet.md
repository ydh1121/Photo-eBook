# Shinwoo-Park/katfishnet

- Reference ID: `editorial-shinwoo-park-katfishnet`
- Source: `Shinwoo-Park/katfishnet`
- URL: `https://github.com/Shinwoo-Park/katfishnet`
- Primary category: `editorial-writing`
- Tags: `korean, llm-detection, linguistic-analysis, spacing, pos-diversity, punctuation, research`
- Status: `approved`
- Review date: `2026-08-19`

## Why it matters

ACL 2025 논문 `Detecting LLM-Generated Korean Text through Linguistic Feature Analysis`의 공식 repository다. 한국어 LLM 문장을 사람 글과 구분할 때 spacing, POS 조합 다양성, comma usage처럼 표면적인 금지어 목록을 넘어선 언어학적 특징을 분석한다.

이 프로젝트에서는 detector를 production에 넣기보다, AI 초안 검수 시 문장 구조가 지나치게 반복되거나 영어식 쉼표 패턴이 누적되는지를 점검하는 연구 근거로 사용한다.

## 참고할 것

- 한국어에서 spacing pattern이 스타일 신호가 될 수 있다는 관점
- POS n-gram diversity를 통해 반복적인 문장 구조를 보는 관점
- comma frequency와 위치를 별도 linguistic signal로 분석하는 방식
- 한국어 LLM 문체를 영어용 detector 규칙으로 그대로 판단하지 않는 원칙
- 여러 장르에서 동일한 문체 신호의 강도가 다를 수 있다는 점

## 적용 후보

- Editorial Library의 발행 전 AI 티 검수 체크리스트
- 반복되는 어미/문장 구조/쉼표 위치를 사람이 확인할 때의 참고 근거
- 향후 자동 lint를 만들 경우 연구 참고자료

## 적용하지 않을 것

- KatFishNet 점수를 ‘사람이 쓴 글인지’의 확정 판정으로 사용하지 않음
- detector를 통과하려고 문장을 의도적으로 왜곡하지 않음
- 논문 데이터셋 장르를 이 플랫폼의 서비스형 콘텐츠와 동일하게 가정하지 않음
- 탐지 회피를 목적으로 문체를 조작하지 않음

## 기술 의존성

원본 연구 구현은 Python 기반이고 형태소/POS·punctuation 분석과 분류기 실험을 포함한다. 현재 platform runtime에는 포함하지 않는다.

## 라이선스

현재 GitHub repository metadata에는 명시적 license가 표시되지 않는다. 따라서 source code/data를 복사하거나 재배포하지 않고 논문과 README의 연구 결과를 참고하는 수준으로 사용한다.

## Integration rule

1. 이 항목은 문체 authority가 아니라 연구 evidence다.
2. 사용자 before/after와 프로젝트 Editorial Library가 최상위 작성 기준이다.
3. 자동 detector를 도입하려면 별도 라이선스·데이터·오탐 평가를 선행한다.
4. 글을 ‘AI detector 우회’용으로 고치는 데 사용하지 않는다.
