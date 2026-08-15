export async function onRequest(context) {
  const { request, env, params } = context;
  const backend = env.APPS_SCRIPT_API_URL;

  if (!backend) {
    return Response.json(
      { ok: false, message: "APPS_SCRIPT_API_URL 환경 변수가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const path = Array.isArray(params.path)
    ? params.path.join("/")
    : String(params.path || "");

  if (request.method === "GET" && path === "site-data") {
    const url = new URL(backend);
    url.searchParams.set("api", "siteData");
    url.searchParams.set("_", String(Date.now()));

    const upstream = await fetch(url.toString(), {
      headers: { "Accept": "application/json" }
    });

    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  }

  if (request.method === "POST" && path === "rpc") {
    const body = await request.text();

    const upstream = await fetch(backend, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body
    });

    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  }

  return Response.json({ ok:false, message:"Not found" }, { status:404 });
}
