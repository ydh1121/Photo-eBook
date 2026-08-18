const ALLOWED = new Set([
  '1cqELYtiDdXDiNNcPD081_oT_l-4hrTt9','1hDdJ65a9SBUXRB8cyFMmJdRhFHxoN8At','1q-l8sikQGb5V6w1w_90GQ0Nvyfl3Kkij','16RSLgI_NhvbEfzPUfar5FvP1EsC5a98r','1ptxW53p7YAHqNzAbYFgvCdlD9CpTMSnk','1XsA8mGnwtLrjDxAYPI_2vxVkQqTXF_E0','1_aNkPIMnpzxpnlHvvLgdBasyEWaQ5Bfs','1iqfem6VlvOYhmEesKBXBpz5DWRakpLje','1ThdRrOFQtZZrmou-5kD7qkz6b-3B833k','1OR3Rhv-H1n3pws-hgnZ7EJ1n02GMp6m3','1_5s6rmCy-M66WItPSuVU_F-3_gfu82rO','1XAKAaW2Cy4ayDv9d440rLoANo1EIJ-90','17RiuYnrxYr-3yREOer9xaJxbJZ5ckvtP','10siGPrMdtr3MCjazlyfplbnF0fnQS8tS','1tjciwRi7gmT2qcgGaTgn-tt4JwuecLzn','1-9fM4-TO1SGzS92WXmUsYM3wP96a3UBt','1znMegDMAJyB0UH_DaFvtpGoEbdG9xVKx','1sh2fnEaVdRTrWGqjfu-OsrR9m9nT2e4V','1RgqV3J8nOB3vEDbeam_hTpZ705pTAOys','1R7IPv0K2hzxZ5RACPKpeRyXvEQvYHjLR','10MB-hUaunNOOb4WUNyw3MneZWN5jnlQq','1_4Vib0vzhdSMDAxGRf80E3NKC_RtFGaf','1ul6l8c_QHl9fXyZS1ffMkwWXj2walzQ7','1KrA3eKsT4Ml52rKF9blRz-DFBqd-ULJp','13ZlFUwm1BFy0zoFJMq2wfvBqZSWSqYIw','1jy8Sggh4rBlraUYUqkPLWby-SA5xUG5c','1Eb_DPTQd3cKLKy9XPyOnuEZEvfQBIg8R','1_vZeZIOOtzZjPe_8RScmtOMdxjkFP7VW','1h_g3Mz_-0QG_mi2ANylhgVEUyhmDXsPr','1LPx5NA4tRNGI7IXZ5lKdxMgci8OQhGag','16zItKYy6if9QvWSS3GGEi9HFrO1NmGZH','1ibtkYFRpr4y4lTPtuA48X8umFH8msX-p','1JOsLk-LsExxBSse9RuANnzF4odKK9iAC','1Z-E1QvvHlDk5dkBEMLQHO7SF7HNJnKEP','1wZq1S1jxVPOhNgk68VzzZb-LPWUaaohk','14vrntf1cThfcoL_krxeCaciXHCPYG9UJ','1OpfsI4Iskrojob8DgDcYed20mhBoxGqO','15rYsYg_XQ0UQ14hYu1c82l1KdqDiotWS','17ChLOCp8E0ttKY6Abl1edvN0o7A6u-S1','1Lkyr10UytKvm6-ETruBrOvVK6g1BO-xR'
]);
let cached = null;

export async function onRequestGet({ env, params }) {
  const id = Array.isArray(params.id) ? params.id.join('/') : String(params.id || '');
  if (!ALLOWED.has(id)) return new Response('Not found', { status: 404 });
  try {
    const token = await getDriveToken(env);
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) return new Response(`Drive ${response.status}`, { status: response.status, headers: { 'Cache-Control': 'no-store' } });
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/webp',
        'Content-Length': response.headers.get('Content-Length') || '',
        'Cache-Control': 'no-store'
      }
    });
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
  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion })
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error(data?.error_description || data?.error || `auth ${response.status}`);
  cached = { token: data.access_token, expiresAt: now + Number(data.expires_in || 3600) };
  return cached.token;
}

function b64json(value) { return b64bytes(new TextEncoder().encode(JSON.stringify(value))); }
function b64bytes(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function pemToBuffer(pem) {
  const body = String(pem).replace(/-----BEGIN PRIVATE KEY-----/g, '').replace(/-----END PRIVATE KEY-----/g, '').replace(/\\n/g, '\n').replace(/\s+/g, '');
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
