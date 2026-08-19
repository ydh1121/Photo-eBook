const FILES = {
  'sony-fe-85-f18': '1znMegDMAJyB0UH_DaFvtpGoEbdG9xVKx'
};

let cachedToken = null;

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const name = String(url.searchParams.get('name') || '').trim();
  const fileId = FILES[name];
  if (!fileId) return new Response('Not found', { status: 404 });

  try {
    const token = await getAccessToken(env);
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) {
      const message = await response.text().catch(() => '');
      return new Response(`Drive fetch failed (${response.status}) ${message.slice(0, 240)}`, {
        status: 502,
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    return new Response(String(error?.message || error || 'proxy error'), {
      status: 500,
      headers: { 'Cache-Control': 'no-store' }
    });
  }
}

async function getAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken?.token && cachedToken.expiresAt - 60 > now) return cachedToken.token;

  const account = parseServiceAccount(env);
  if (!account?.client_email || !account?.private_key) {
    throw new Error('Google service account secret is not configured');
  }

  const tokenUri = account.token_uri || 'https://oauth2.googleapis.com/token';
  const header = base64UrlJson({ alg: 'RS256', typ: 'JWT' });
  const claims = base64UrlJson({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    aud: tokenUri,
    exp: now + 3600,
    iat: now
  });
  const signingInput = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(account.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    key,
    new TextEncoder().encode(signingInput)
  );
  const assertion = `${signingInput}.${base64UrlBytes(new Uint8Array(signature))}`;

  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    throw new Error(data?.error_description || data?.error || `Google auth failed (${response.status})`);
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: now + Number(data.expires_in || 3600)
  };
  return cachedToken.token;
}

function parseServiceAccount(env) {
  const raw = env.GOOGLE_SERVICE_ACCOUNT_JSON || env.GOOGLE_SERVICE_ACCOUNT_JS || '';
  if (!raw) return null;
  if (typeof raw !== 'string') return raw;
  return JSON.parse(raw);
}

function base64UrlJson(value) {
  return base64UrlBytes(new TextEncoder().encode(JSON.stringify(value)));
}

function base64UrlBytes(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function pemToArrayBuffer(pem) {
  const body = String(pem)
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\s/g, '');
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
