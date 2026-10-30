// A few warm words from the AI about a household's month, for the monthly summary in the app.
// Only for steady users (cart_month_steady: 8+ active days across 3+ weeks), only once the month is over
// (or on its last evening), and only once per user, household and month: the text is cached in
// cart_month_summaries and every later open reads it from there. Gemini key shared with categorize.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const PREFERRED = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash"];
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
    const list = [...PREFERRED.filter((p) => all.includes(p)), ...all.filter((n: string) => !PREFERRED.includes(n))].slice(0, 4);
    if (list.length) { cached = { at: Date.now(), list }; return list; }
  } catch { /* fall through */ }
  return PREFERRED;
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Israel date parts, to know whether the month is over yet
function israelNow() {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const g = (k: string) => +(p.find((x) => x.type === k)?.value ?? 0);
  return { y: g("year"), m: g("month"), d: g("day"), h: g("hour") };
}
function monthIsOver(month: string) {
  const [y, m] = month.split("-").map(Number);
  const n = israelNow();
  if (y < n.y || (y === n.y && m < n.m)) return true;
  return y === n.y && m === n.m && n.d === new Date(n.y, n.m, 0).getDate() && n.h >= 18;
}

const SYSTEM_HE = `את/ה העוזר/ת החם/ה של אפליקציית רשימת הקניות המשפחתית "קניות ביחד".
כתוב/י סיכום קצר לחודש של משק הבית, בעברית, 3 עד 4 משפטים, בגוף שני אל המשתמש (בשמו).
- התבסס/י רק על הנתונים שקיבלת. אל תמציא/י מספרים, מוצרים או אירועים.
- ציין/י דבר אחד או שניים מעניינים מהנתונים (מוצר שחזר הרבה, היום העמוס, מי עזר הכי הרבה, שינוי בהוצאה).
- אפשר טיפ קטן ומעשי אחד לחודש הבא, בלי להטיף.
- טון חם, קליל וקצת הומור. בלי כותרות, בלי רשימות, בלי האשטגים, עד אימוג'י אחד.`;
const SYSTEM_EN = `You are the warm assistant of the family shopping-list app "CartSync".
Write a short summary of the household's month in English, 3 to 4 sentences, speaking to the user by name.
- Use only the data given. Never invent numbers, products or events.
- Mention one or two interesting things from the data (a repeat item, the busiest day, who helped most, a change in spending).
- One small practical tip for next month is fine, without preaching.
- Warm, light, a little humour. No headings, lists or hashtags, at most one emoji.`;

async function write(key: string, system: string, prompt: string): Promise<string | null> {
  for (const model of await models(key)) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25000);
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST", signal: ctrl.signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 400 },
        }),
      });
      clearTimeout(t);
      if (!r.ok) { if (r.status === 404) cached = null; continue; }
      const d = await r.json();
      const text = (d.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? "").join("").trim();
      if (text) return text.slice(0, 900);
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
  const household = String(body.household ?? "");
  const month = String(body.month ?? "");
  if (!/^[0-9a-f-]{36}$/.test(household) || !/^\d{4}-\d{2}-01$/.test(month)) return json({ error: "bad_input" }, 400);
  if (!monthIsOver(month)) return json({ error: "too_early" }, 400);

  // as the user: checks membership and gives the numbers, the steady flag and any cached text
  const { data: st, error } = await asUser.rpc("cart_month_stats", { p_household: household, p_month: month });
  if (error || !st) return json({ error: "stats" }, 403);
  if (st.ai_text) return json({ ai_text: st.ai_text });
  if (!st.me?.steady) return json({ error: "not_steady" }, 403);

  const me = (st.members ?? []).find((m: any) => m.user_id === user.id);
  const he = body.lang !== "en";
  const facts = {
    user_name: me?.name ?? "", household: st.household, month,
    trips: st.trips, spent_ils: st.spent, spent_last_month_ils: st.spent_prev, new_lists: st.lists_new,
    items_added: st.added, items_collected: st.bought, requests: st.requests,
    biggest_trip: st.biggest, most_added_items: st.top_items, top_categories: st.top_cats,
    busiest_weekday: st.busiest_dow == null ? null : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][st.busiest_dow],
    members: (st.members ?? []).map((m: any) => ({ name: m.name, added: m.added, collected: m.bought, trips_closed: m.trips, paid_ils: m.paid })),
    user_active_days: st.me?.days,
  };
  const text = await write(key, he ? SYSTEM_HE : SYSTEM_EN, JSON.stringify(facts));
  if (!text) return json({ error: "busy" }, 503);

  // cache it with the service role (the table has no insert policy for users)
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  await admin.from("cart_month_summaries").upsert({ user_id: user.id, household_id: household, month, ai_text: text }, { onConflict: "user_id,household_id,month" });
  return json({ ai_text: text });
});
