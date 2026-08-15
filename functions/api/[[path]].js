const SHEETS = {
  content: 'CONTENT_DB',
  nav: 'NAV_MODULES',
  market: 'MARKET_TOP3',
  education: 'EDUCATION',
  skills: 'SKILLS',
  equipment: 'EQUIPMENT',
  actionPlan: 'ACTION_PLAN',
  scripts: 'SCRIPTS',
  products: 'PRODUCTS',
  portfolio: 'PORTFOLIO',
  guideCopy: 'GUIDE_COPY',
  photoLessons: 'PHOTO_LESSONS',
  cameraPresets: 'CAMERA_PRESETS',
  sources: 'SOURCES'
};

let cachedToken = null;

export async function onRequest(context) {
  const { request, env, params } = context;
  const path = Array.isArray(params.path) ? params.path.join('/') : String(params.path || '');

  try {
    if (request.method === 'GET' && path === 'health') {
      const account = parseServiceAccount(env);
      return json({
        ok: Boolean(env.GOOGLE_SHEET_ID && account?.client_email && account?.private_key),
        sheetConfigured: Boolean(env.GOOGLE_SHEET_ID),
        serviceAccountConfigured: Boolean(account?.client_email && account?.private_key)
      });
    }

    if (request.method === 'GET' && path === 'site-data') {
      const cache = caches.default;
      const cacheKey = new Request(request.url, { method: 'GET' });
      const cached = await cache.match(cacheKey);
      if (cached) return cached;

      const data = await getSiteData(env);
      const response = json(
        { ok: true, data },
        200,
        { 'Cache-Control': 'public, max-age=20, s-maxage=30, stale-while-revalidate=300' }
      );
      context.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    }

    if (request.method === 'POST' && path === 'rpc') {
      const body = await request.json().catch(() => ({}));
      const action = String(body?.action || '');

      if (action === 'getQuestionHistory') return json(await getQuestionHistory(env, body));
      if (action === 'saveQuestionHistory') return json(await saveQuestionHistory(env, body));
      if (action === 'deleteQuestionHistory') return json(await deleteQuestionHistory(env, body));

      return json({ ok: false, message: '지원하지 않는 요청입니다.' }, 400);
    }

    return json({ ok: false, message: 'Not found' }, 404);
  } catch (error) {
    console.error(error);
    return json({ ok: false, message: safeErrorMessage(error) }, 500, { 'Cache-Control': 'no-store' });
  }
}

async function getSiteData(env) {
  const entries = Object.entries(SHEETS);
  const batch = await readSheetBatchValues(env, entries.map(([, sheetName]) => sheetName));
  const raw = {};

  entries.forEach(([key], index) => {
    raw[key] = valuesToObjects(batch[index] || []);
  });

  const content = {};
  for (const row of raw.content || []) {
    if (row['키']) content[row['키']] = row['값'] || '';
  }

  const numberOf = (v) => Number(String(v || '').replace(/[^\d.-]/g, '')) || 9999;
  const ordered = (rows) => [...(rows || [])].sort((a, b) => numberOf(a['순서']) - numberOf(b['순서']));

  return {
    content,
    nav: ordered(raw.nav).filter(r => String(r['enabled']).toUpperCase() !== 'FALSE'),
    market: raw.market || [],
    education: raw.education || [],
    skills: raw.skills || [],
    equipment: raw.equipment || [],
    actionPlan: raw.actionPlan || [],
    scripts: ordered(raw.scripts),
    products: raw.products || [],
    portfolio: raw.portfolio || [],
    guideCopy: ordered(raw.guideCopy),
    photoLessons: ordered(raw.photoLessons),
    cameraPresets: raw.cameraPresets || [],
    sources: raw.sources || []
  };
}

async function getQuestionHistory(env, body) {
  const deviceId = normalizeDeviceId(body?.deviceId || '');
  if (!deviceId) return { ok: false, message: '기기 식별값이 없습니다.', history: [] };

  const rows = await readSheetObjects(env, 'QUESTION_HISTORY', true);
  const history = rows
    .filter(row => String(row.device_id || '') === deviceId)
    .slice(-100)
    .reverse()
    .map(row => ({
      id: row.id,
      selected_text: row.selected_text,
      question: row.question,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

  return { ok: true, history };
}

async function saveQuestionHistory(env, body) {
  const deviceId = normalizeDeviceId(body?.deviceId || '');
  const payload = body?.payload || {};
  const id = String(payload.id || crypto.randomUUID()).slice(0, 160);
  const selectedText = String(payload.selectedText || '').trim().slice(0, 5000);
  const question = String(payload.question || '').trim().slice(0, 3000);

  if (!deviceId || !selectedText || !question) {
    return { ok: false, message: '선택 문장과 질문을 확인해 주세요.' };
  }

  const rows = await readSheetValues(env, 'QUESTION_HISTORY');
  const headers = rows[0] || [];
  const expected = ['id', 'device_id', 'selected_text', 'question', 'created_at', 'updated_at'];

  if (!headers.length) {
    await updateRange(env, 'QUESTION_HISTORY!A1:F1', [expected]);
  } else if (!expected.every((v, i) => headers[i] === v)) {
    await updateRange(env, 'QUESTION_HISTORY!A1:F1', [expected]);
  }

  const currentRows = headers.length ? rows : [expected];
  const idIndex = expected.indexOf('id');
  const deviceIndex = expected.indexOf('device_id');
  const createdIndex = expected.indexOf('created_at');
  const now = koreaTime();

  let targetRow = -1;
  let createdAt = now;

  for (let i = 1; i < currentRows.length; i++) {
    if (String(currentRows[i][idIndex] || '') === id && String(currentRows[i][deviceIndex] || '') === deviceId) {
      targetRow = i + 1;
      createdAt = String(currentRows[i][createdIndex] || now);
      break;
    }
  }

  const values = [[id, deviceId, selectedText, question, createdAt, now]];
  if (targetRow > 0) await updateRange(env, `QUESTION_HISTORY!A${targetRow}:F${targetRow}`, values);
  else await appendRange(env, 'QUESTION_HISTORY!A:F', values);

  return { ok: true, item: { id, selected_text: selectedText, question, created_at: createdAt, updated_at: now } };
}

async function deleteQuestionHistory(env, body) {
  const deviceId = normalizeDeviceId(body?.deviceId || '');
  const id = String(body?.id || '').trim();
  if (!deviceId || !id) return { ok: false, message: '삭제할 질문을 찾지 못했습니다.' };

  const rows = await readSheetValues(env, 'QUESTION_HISTORY');
  if (rows.length < 2) return { ok: true };

  const headers = rows[0];
  const idIndex = headers.indexOf('id');
  const deviceIndex = headers.indexOf('device_id');

  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][idIndex] || '') === id && String(rows[i][deviceIndex] || '') === deviceId) {
      await clearRange(env, `QUESTION_HISTORY!A${i + 1}:F${i + 1}`);
      return { ok: true };
    }
  }
  return { ok: true };
}

function valuesToObjects(values) {
  if (!values.length) return [];
  const headers = values[0].map(v => String(v || '').trim());
  return values.slice(1)
    .filter(row => row.some(cell => String(cell || '').trim() !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((header, i) => { if (header) obj[header] = row[i] ?? ''; });
      return obj;
    });
}

async function readSheetObjects(env, sheetName, allowMissing = false) {
  try {
    return valuesToObjects(await readSheetValues(env, sheetName));
  } catch (error) {
    if (allowMissing) return [];
    throw error;
  }
}

async function readSheetBatchValues(env, sheetNames) {
  const token = await getAccessToken(env);
  const sheetId = requireSheetId(env);
  const params = new URLSearchParams();
  sheetNames.forEach(sheetName => params.append('ranges', `${sheetName}!A:ZZ`));
  params.set('majorDimension', 'ROWS');
  params.set('valueRenderOption', 'FORMATTED_VALUE');

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values:batchGet?${params.toString()}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Google Sheets 읽기 실패 (${response.status})`);

  const ranges = Array.isArray(data.valueRanges) ? data.valueRanges : [];
  return sheetNames.map((_, index) => Array.isArray(ranges[index]?.values) ? ranges[index].values : []);
}

async function readSheetValues(env, sheetName) {
  const token = await getAccessToken(env);
  const sheetId = requireSheetId(env);
  const range = encodeURIComponent(`${sheetName}!A:ZZ`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${range}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Google Sheets 읽기 실패 (${response.status})`);
  return Array.isArray(data.values) ? data.values : [];
}

async function appendRange(env, range, values) {
  const token = await getAccessToken(env);
  const sheetId = requireSheetId(env);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ majorDimension: 'ROWS', values })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Google Sheets 추가 실패 (${response.status})`);
  return data;
}

async function updateRange(env, range, values) {
  const token = await getAccessToken(env);
  const sheetId = requireSheetId(env);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ majorDimension: 'ROWS', values })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Google Sheets 수정 실패 (${response.status})`);
  return data;
}

async function clearRange(env, range) {
  const token = await getAccessToken(env);
  const sheetId = requireSheetId(env);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}:clear`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: '{}'
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Google Sheets 삭제 실패 (${response.status})`);
  return data;
}

async function getAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken?.token && cachedToken.expiresAt - 60 > now) return cachedToken.token;

  const account = parseServiceAccount(env);
  if (!account?.client_email || !account?.private_key) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON Secret을 확인해 주세요.');

  const tokenUri = account.token_uri || 'https://oauth2.googleapis.com/token';
  const header = base64UrlJson({ alg: 'RS256', typ: 'JWT' });
  const claims = base64UrlJson({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: tokenUri,
    exp: now + 3600,
    iat: now
  });
  const signingInput = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    'pkcs8', pemToArrayBuffer(account.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' }, key, new TextEncoder().encode(signingInput)
  );
  const assertion = `${signingInput}.${base64UrlBytes(new Uint8Array(signature))}`;

  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) throw new Error(data?.error_description || data?.error || `Google 인증 실패 (${response.status})`);

  cachedToken = { token: data.access_token, expiresAt: now + Number(data.expires_in || 3600) };
  return cachedToken.token;
}

function parseServiceAccount(env) {
  const raw = env.GOOGLE_SERVICE_ACCOUNT_JSON || env.GOOGLE_SERVICE_ACCOUNT_JS || '';
  if (!raw) return null;
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch { throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON 값이 올바른 JSON 형식이 아닙니다.'); }
}

function requireSheetId(env) {
  const id = String(env.GOOGLE_SHEET_ID || '').trim();
  if (!id) throw new Error('GOOGLE_SHEET_ID 환경변수가 없습니다.');
  return id;
}

function base64UrlJson(value) {
  return base64UrlBytes(new TextEncoder().encode(JSON.stringify(value)));
}

function base64UrlBytes(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function pemToArrayBuffer(pem) {
  const body = String(pem)
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\s+/g, '');
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function normalizeDeviceId(value) {
  const text = String(value || '').trim();
  return /^[A-Za-z0-9._:-]{12,180}$/.test(text) ? text : '';
}

function koreaTime() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(new Date()).replace('T', ' ');
}

function safeErrorMessage(error) {
  return String(error?.message || error || '알 수 없는 오류')
    .replace(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g, '[redacted]');
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders }
  });
}
