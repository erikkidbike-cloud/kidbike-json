// netlify/functions/submit.js  (Functions v2, ESM)
export default async (request, context) => {
  const ORIGIN = process.env.ORIGIN || '*';     // bv. "https://chipper-horse-0661c0.netlify.app"
  const GAS_URL = process.env.GAS_URL;          // bv. jouw Apps Script Web App URL (exec)
  const SECRET  = process.env.SECRET;           // zelfde waarde als Script Property SECRET in GAS

  const cors = {
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (!GAS_URL || !SECRET) {
    return new Response(JSON.stringify({ ok:false, error:'Missing GAS_URL or SECRET env' }), {
      status: 500, headers: { ...cors, 'content-type':'application/json' }
    });
  }

  if (request.method === 'OPTIONS') {
    // CORS preflight
    return new Response('', { status: 204, headers: cors });
  }

  try {
    if (request.method === 'GET') {
      // Proxy voor holds: voeg ?t=<SECRET> toe
      const inUrl = new URL(request.url);
      const outUrl = new URL(GAS_URL);
      // kopieer query
      for (const [k,v] of inUrl.searchParams.entries()) outUrl.searchParams.set(k, v);
      // voeg secret toe zoals jouw GAS accepteert
      outUrl.searchParams.set('t', SECRET);

      const r = await fetch(outUrl.toString(), { method: 'GET' });
      const txt = await r.text();
      return new Response(txt, {
        status: r.status,
        headers: { ...cors, 'content-type': r.headers.get('content-type') || 'application/json' }
      });
    }

    if (request.method === 'POST') {
      // Lees JSON van frontend, voeg secret toe in body
      const raw = await request.text();
      let payload;
      try {
        payload = JSON.parse(raw || '{}');
      } catch {
        return new Response(JSON.stringify({ ok:false, error:'Invalid JSON' }), {
          status: 400, headers: { ...cors, 'content-type':'application/json' }
        });
      }
      payload.secret = SECRET;

      const gasRes = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'content-type': 'text/plain;charset=utf-8' }, // geen preflight
        body: JSON.stringify(payload),
      });
      const gasTxt = await gasRes.text();

      return new Response(gasTxt, {
        status: gasRes.status,
        headers: { ...cors, 'content-type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ ok:false, error:'Method Not Allowed' }), {
      status: 405, headers: { ...cors, 'content-type':'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok:false, error: String(err && err.message || err) }), {
      status: 502, headers: { ...cors, 'content-type':'application/json' }
    });
  }
};
