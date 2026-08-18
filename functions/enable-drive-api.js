export async function onRequestGet({ env }) {
  try {
    const token = await getToken(env);
    const url = 'https://serviceusage.googleapis.com/v1/projects/936977151581/services/drive.googleapis.com:enable';
    const response = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}' });
    const text = await response.text();
    return new Response(text, { status: response.status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error?.message || error) }), { status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }
}
async function getToken(env) {
  const raw = env.GOOGLE_SERVICE_ACCOUNT_JSON || env.GOOGLE_SERVICE_ACCOUNT_JS || '';
  const account = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!account?.client_email || !account?.private_key) throw new Error('service account unavailable');
  const now = Math.floor(Date.now()/1000);
  const tokenUri = account.token_uri || 'https://oauth2.googleapis.com/token';
  const input = `${b64(new TextEncoder().encode(JSON.stringify({alg:'RS256',typ:'JWT'})))}.${b64(new TextEncoder().encode(JSON.stringify({iss:account.client_email,scope:'https://www.googleapis.com/auth/cloud-platform',aud:tokenUri,exp:now+3600,iat:now})))}`;
  const key = await crypto.subtle.importKey('pkcs8', pem(account.private_key), {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'}, false, ['sign']);
  const sig = await crypto.subtle.sign({name:'RSASSA-PKCS1-v1_5'}, key, new TextEncoder().encode(input));
  const assertion = `${input}.${b64(new Uint8Array(sig))}`;
  const response = await fetch(tokenUri,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})});
  const data = await response.json();
  if(!response.ok || !data.access_token) throw new Error(data?.error_description || data?.error || `auth ${response.status}`);
  return data.access_token;
}
function b64(bytes){let s='';for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');}
function pem(value){const body=String(value).replace(/-----BEGIN PRIVATE KEY-----/g,'').replace(/-----END PRIVATE KEY-----/g,'').replace(/\\n/g,'\n').replace(/\s+/g,'');const bin=atob(body);const out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out.buffer;}
