import { getLearningOpportunities, parseFilters } from '../lib/learning-opportunities.js';

export async function onRequestGet(context) {
  let filters;
  try { filters = parseFilters(new URL(context.request.url)); }
  catch (error) { return json({ ok: false, items: [], providers: [], lastCheckedAt: null, error: error.message }, 400); }
  try { return json(await getLearningOpportunities(context, filters)); }
  catch { return json({ ok: false, items: [], providers: [], lastCheckedAt: null, error: '공고를 불러오지 못했습니다.' }, 503); }
}

function json(body, status = 200) {
  // Provider HTML is cached internally. Application deadlines are recalculated per response.
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
