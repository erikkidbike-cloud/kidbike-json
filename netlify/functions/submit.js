export default async (req, res) => {
  if (req.method === "OPTIONS") {
    return res.status(204).set({
      "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    }).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ ok:false, error:"METHOD_NOT_ALLOWED" });
  }

  const allowOrigin = process.env.CORS_ORIGIN || "*";
  const target = process.env.APPS_SCRIPT_URL;      // eindigt op /exec
  const secret = process.env.SUBMIT_SHARED_SECRET; // lange random string

  if (!target || !secret) {
    return res.status(500).set("Access-Control-Allow-Origin", allowOrigin)
      .json({ ok:false, error:"MISSING_SERVER_CONFIG" });
  }

  try {
    const body = await readJson(req);

    // Secret NIET in payload; voeg toe als queryparameter t=...
    const url = new URL(target);
    url.searchParams.set("t", secret);

    const resp = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),     // payload blijft ongewijzigd
    });

    const text = await resp.text();
    let out; try { out = JSON.parse(text); } catch { out = { ok: resp.ok, raw: text }; }

    return res.status(resp.status)
      .set("Access-Control-Allow-Origin", allowOrigin)
      .json(out);

  } catch (err) {
    return res.status(500)
      .set("Access-Control-Allow-Origin", allowOrigin)
      .json({ ok:false, error:String(err && err.message || err) });
  }
};

async function readJson(req){
  const chunks=[]; for await (const c of req) chunks.push(c);
  const text = Buffer.concat(chunks).toString("utf8") || "{}";
  return JSON.parse(text);
}
