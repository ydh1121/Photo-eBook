const ALLOWED = new Set(['1cqELYtiDdXDiNNcPD081_oT_l-4hrTt9']);
let cached = null;

export async function onRequestGet({ env, params }) {
  const id = Array.isArray(params.id) ? params.id.join('/') : String(params.id || '');
  if (!ALLOWED.has(id)) return new Response('Not found', { status: 404 });
  try {
    const token = await getDriveToken(env);
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      return new Response(`Drive ${response.status}: ${detail.slice(0, 1800)}`, { status: response.status, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' } });
    }
    return new Response(response.body, { status: 200, headers: { 'Content-Type': response.headers.get('Content-Type') || 'image/webp', 'Cache-Control': 'no-store' } });
  } catch (error) {
    return new Response(String(error?.message || error), { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}

async function getDriveToken(env) {
  const now = Math.floor(Date.now() / 1000);
  if (cached?.token && cached.expiresAt - 60 > now) return cached.token;
  const raw = env.GOOGLE_SERVICE_ACCOUNT_JSON || env.GOOGLE_SERVICE_ACCOUNT_JS || '';
  const account = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!account?.client_email || !account?.private_key) throw new Error('service account unavailable');
  const tokenUri = account.token_uri || 'https://oauth2.googleapis.com/token';
  const header = b64json({ alg: 'RS256', typ: 'JWT' });
  const claims = b64json({ iss: account.client_email, scope: 'https://www.googleapis.com/auth/drive.readonly', aud: tokenUri, exp: now + 3600, iat: now });
  const signingInput = `${header}.${claims}`;
  const key = await crypto.subtle.importKey('pkcs8', pemToBuffer(account.private_key), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, key, new TextEncoder().encode(signingInput));
  const assertion = `${signingInput}.${b64bytes(new Uint8Array(signature))}`;
  const response = await fetch(tokenUri, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) throw new Error(data?.error_description || data?.error || `auth ${response.status}`);
  cached = { token: data.access_token, expiresAt: now + Number(data.expires_in || 3600) };
  return cached.token;
}
function b64json(value) { return b64bytes(new TextEncoder().encode(JSON.stringify(value))); }
function b64bytes(bytes) { let binary=''; for(let i=0;i<bytes.length;i+=0x8000) binary += String.fromCharCode(...bytes.subarray(i,i+0x8000)); return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,''); }
function pemToBuffer(pem) { const body=String(pem).replace(/-----BEGIN PRIVATE KEY-----/g,'').replace(/-----END PRIVATE KEY-----/g,'').replace(/\\n/g,'\n').replace(/\s+/g,''); const binary=atob(body); const bytes=new Uint8Array(binary.length); for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i); return bytes.buffer; }
