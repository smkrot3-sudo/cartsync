# Smoke test (no network, no real Supabase)

`node tools/smoke/smoke.js` opens docs/index.html in headless Chromium (Playwright) with
`vendor/supabase.js` swapped for `mock-supabase.js`: an in-memory household with an owner (u1),
an editor (u2), a requester (u3) and a legacy viewer (u4, shown as a requester). It clicks through
every tab, the list screen, sheets and Android-style back, saves screenshots to `tools/smoke/shots/`
(or `$OUT`), and prints `PAGE ERRORS: n` at the end. Anything above 0 is a bug.

`app-version.json` is blocked on purpose: otherwise the update check reloads the page mid-test.
