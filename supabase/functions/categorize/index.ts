// Categorizes grocery items into CartSync's fixed category list + an emoji, for items the local
// keyword dictionary (web/parts/app.js DICT) didn't recognize. Gemini key is shared with tsaad-katan's
// "coach" function (same project secrets) — never exposed to the app.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CATS = ["dairy","produce","bakery","meat","frozen","pantry","beverages","snacks","household","care","baby","pet","other"];
const PREFERRED = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];
let cached: { at: number; list: string[] } | null = null;
async function models(key: string): Promise<string[]> {
  if (cached && Date.now() - cached.at < 6 * 3600 * 1000) return cached.list;
  try {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", { headers: { "x-goog-api-key": key } });
    const all = ((await r.json()).models ?? [])
      .filter((m: any) => (m.supportedGenerationMethods ?? []).includes("generateContent"))
      .map((m: any) => String(m.name).replace(/^models\//, ""))
      .filter((n: string) => /^gemini-[\d.]+-flash(-lite)?$/.test(n));
    const ver = (n: string) => parseFloat(n.split("-")[1]) - (n.endsWith("lite") ? 0.01 : 0);
    all.sort((a: string, b: string) => ver(b) - ver(a));
    const list = [...PREFERRED.filter((p) => all.includes(p)), ...all.filter((n: string) => !PREFERRED.includes(n))].slice(0, 3);
    if (list.length) { cached = { at: Date.now(), list }; return list; }
  } catch { /* fall through */ }
  return PREFERRED;
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SYSTEM = `את/ה מסווג/ת פריטי קניות לסופר לרשימת הקטגוריות הקבועה הזו בלבד: ${CATS.join(", ")}.
לכל פריט תן גם אימוג'י יחיד שמתאר אותו בצורה הכי ספציפית ומתאימה (לא רק אימוג'י גנרי של הקטגוריה כשיש אחד מדויק יותר).
אם ממש לא ברור או לא פריט מזון/בית, סווג כ-"other" עם אימוג'י 🛒.
קלט יכול להיות בעברית או אנגלית.`;
const SCHEMA = {
  type: "ARRAY",
  items: { type: "OBJECT", properties: { category: { type: "STRING", enum: CATS }, emoji: { type: "STRING" } }, required: ["category", "emoji"] },
};

async function classify(key: string, texts: string[]): Promise<{ category: string; emoji: string }[] | null> {
  for (const model of await models(key)) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20000);
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST", signal: ctrl.signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: "user", parts: [{ text: JSON.stringify(texts) }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1024, responseMimeType: "application/json", responseSchema: SCHEMA },
        }),
      });
      clearTimeout(t);
      if (!r.ok) { if (r.status === 404) cached = null; continue; }
      const d = await r.json();
      const raw = (d.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? "").join("");
      const out = JSON.parse(raw);
      if (Array.isArray(out) && out.length === texts.length) return out;
    } catch { clearTimeout(t); }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const key = (Deno.env.get("GEMINI_API_KEY") ?? "").trim().replace(/^["']|["']$/g, "");
  if (!key) return json({ error: "no_key" }, 503);

  const url = Deno.env.get("SUPABASE_URL")!;
  const auth = req.headers.get("Authorization") ?? "";
  const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: { user } } = await asUser.auth.getUser();
  if (!user) return json({ error: "auth" }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const texts: string[] = Array.isArray(body.texts) ? body.texts.map((t: unknown) => String(t).slice(0, 80)) : typeof body.text === "string" ? [body.text.slice(0, 80)] : [];
  if (!texts.length || texts.length > 25) return json({ error: "bad_input" }, 400);

  const out = await classify(key, texts);
  if (!out) return json({ error: "busy" }, 503);
  const results = out.map((o) => ({ category: CATS.includes(o.category) ? o.category : "other", emoji: String(o.emoji || "🛒").slice(0, 8) }));
  return json({ results });
});
