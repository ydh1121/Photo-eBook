import {searchYouTube, rankVideos, categoryForQuery, fallbackSearchCard, safeMessage, json} from '../lib/video-discovery.js';

const SEARCHES = [
  { query: '인물 사진 리터칭 포토샵 피부 보정', category: '인물 리터칭' },
  { query: '제품 사진 포토샵 누끼 리터칭', category: '제품 리터칭' },
  { query: '인테리어 공간 사진 보정 라이트룸', category: '공간 보정' },
  { query: '상업사진 셀렉 납품 워크플로우', category: '셀렉 / 납품' },
  { query: '제품 사진 조명 촬영 세팅', category: '제품 촬영' },
  { query: '음식 사진 촬영 조명', category: '음식 촬영' },
  { query: '상업사진 포트폴리오 만드는 법', category: '포트폴리오' },
  { query: '라이트룸 컬러 보정 사진', category: '색보정' },
  { query: '아이폰 제품 사진 촬영', category: '모바일 촬영' },
  { query: '사진 RAW 셀렉 보정 워크플로우', category: 'RAW 워크플로우' },
  { query: '상업사진 고객 납품 수정 견적', category: '납품 / 운영' },
  { query: '스튜디오 제품 사진 촬영', category: '스튜디오 촬영' }
];

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const cursor = Math.max(0, Number.parseInt(url.searchParams.get('cursor') || '0', 10) || 0);
  const requested = String(url.searchParams.get('q') || '').trim().slice(0, 100);
  const preset = SEARCHES[cursor % SEARCHES.length];
  const query = requested || preset.query;
  const category = categoryForQuery(query, preset.category);

  try {
    const items = await searchYouTube(query, category);
    return json({
      ok: true,
      query,
      category,
      cursor,
      nextCursor: cursor + 1,
      items: rankVideos(items, query).slice(0, 12)
    }, 200, { 'Cache-Control': 'public, max-age=120, s-maxage=600' });
  } catch (error) {
    console.warn('videos discovery fallback', safeMessage(error));
    return json({
      ok: true,
      query,
      category,
      cursor,
      nextCursor: cursor + 1,
      items: [fallbackSearchCard(query, category)],
      fallback: true
    }, 200, { 'Cache-Control': 'public, max-age=60, s-maxage=120' });
  }
}
