let cached = null;
const ALLOWED = new Set(['1cqELYtiDdXDiNNcPD081_oT_l-4hrTt9']);

export async function onRequestGet({ env, params }) {
  const id = Array.isArray(params.id) ? params.id.join('/') : String(params.id || '');
  const raw = env.GOOGLE_SERVICE_ACCOUNT_JSON || env.GOOGLE_SERVICE_ACCOUNT_JS || '';
  const account = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (id === '_identity') return new Response(String(account?.client_email || ''), { headers: { 'Content-Type':'text/plain; charset=utf-8', 'Cache-Control':'no-store' } });
  if (!ALLOWED.has(id)) return new Response('Not found', { status: 404 });
  try {
    const token = await getToken(env, account);
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'follow'
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      return new Response(`upstream ${response.status}: ${detail.slice(0, 500)}`, { status: response.status, headers: { 'Cache-Control': 'no-store' } });
    }
    return new Response(response.body, {
      headers: { 'Content-Type': response.headers.get('Content-Type') || 'image/webp', 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    return new Response(String(error?.message || error), { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}

async function getToken(env, account) {
  const now = Math.floor(Date.now() / 1000);
  if (cached?.token && cached.expiresAt - 60 > now) return cached.token;
  if (!account?.client_email || !account?.private_key) throw new Error('service account unavailable');
  const tokenUri = account.token_uri || 'https://oauth2.googleapis.com/token';
  const h = b64(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const c = b64(new TextEncoder().encode(JSON.stringify({ iss: account.client_email, scope: 'https://www.googleapis.com/auth/drive.readonly', aud: tokenUri, exp: now + 3600, iat: now })));
  const input = `${h}.${c}`;
  const key = await crypto.subtle.importKey('pkcs8', pem(account.private_key), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, key, new TextEncoder().encode(input));
  const assertion = `${input}.${b64(new Uint8Array(sig))}`;
  const response = await fetch(tokenUri, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }) });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error(data?.error_description || data?.error || `auth ${response.status}`);
  cached = { token: data.access_token, expiresAt: now + Number(data.expires_in || 3600) };
  return cached.token;
}
function b64(bytes) { let s=''; for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode(...bytes.subarray(i,i+0x8000)); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,''); }
function pem(value) { const body=String(value).replace(/-----BEGIN PRIVATE KEY-----/g,'').replace(/-----END PRIVATE KEY-----/g,'').replace(/\\n/g,'\n').replace(/\s+/g,''); const bin=atob(body); const out=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i); return out.buffer; }
