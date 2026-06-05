# AVUSD — Hide Google AI Mode

A tiny, self-hosted Chrome/ChromeOS extension that removes Google Search's **AI
Mode** for the district's Student OU. Force-installed via the Google Admin
console. **It is one of two pieces** — see "Two surfaces" below.

## What it does
- If a search page loads in AI Mode (`udm=50`), it **redirects** to the normal
  AI-free Web results (`udm=14`) so the AI Mode page never renders.
- It **hides** the AI Mode pill/tab and AI Overview blocks from the results page
  as Google rebuilds the DOM.
- Scoped to `google.com` only. No data collection, no extra permissions.

## Two surfaces — you need BOTH the policy AND the extension
Google serves AI Mode in two separate places. One Admin setting only covers one of
them:

| Surface | Where it lives | What blocks it |
|---|---|---|
| **AI Mode built into Chrome** | The address bar / new-tab search box. Opens an internal `chrome://contextual-tasks/` page. | **Admin policy `AIModeSettings` = "Do not allow AI Mode."** Extensions **cannot** run on `chrome://` pages, so the extension is powerless here. |
| **AI Mode inside the google.com page** | The in-page "AI Mode" tab/pill and AI Overviews on a normal results page (`udm=50`). | **This extension** (redirect + hide). It's Google web content tied to the under-18 account — no Admin switch removes it. |

**The Admin policy alone is not enough, and the extension alone is not enough.**
Set `AIModeSettings` to "Do not allow" on the Student OU (Devices → Chrome →
Settings → Users & browsers → search "AI Mode", under Generative AI; pair with
`GenAiDefaultSettings` = "Do not allow"), **and** force-install this extension.
Verified in pilot (June 2026): with the policy on, the google.com AI Mode tab may
still appear, but running a search lands on normal results — the extension's
redirect catches it.

(We verified the older native levers too — age-based access under-18, Text
Capture, Lens region search, Search & Assistant all denied — and none of them
touch either AI Mode surface.)

## Key facts
- `udm=50` = AI Mode → **block/redirect**.
- `udm=14` = AI-free "Web" tab → **always allow** (never block this).
- No `udm` = default "All" results.
- Extension ID (fixed, derived from `key.pem`): `igikhjlfhppkgdlhdfpggnomaicbcllo`
- **`key.pem` is a secret.** It's gitignored. Never commit or host it. Keep the
  canonical copy in the district password vault; place it in this folder before
  building. Regenerating it changes the extension ID and breaks force-install.

## Build
1. Set `hostBaseUrl` in `config.json` to the HTTPS base URL (folder) that will
   serve the files. It ships with a placeholder — the build **will not finish**
   until you replace it.
2. Run:
   ```bash
   npm install
   npm run build
   ```
   This produces:
   - `dist/avusd-hide-ai-mode.crx` — the signed extension (**host this**)
   - `dist/update.xml` — the update manifest, with `codebase` already pointing at
     `<hostBaseUrl>/avusd-hide-ai-mode.crx` (**host this**)

   The `appid` in `update.xml` must read `igikhjlfhppkgdlhdfpggnomaicbcllo`. The
   build derives this from `key.pem`, so if it doesn't match, the wrong key is in
   the folder — stop and get the right one from the vault.

## Host the two files
Upload `dist/avusd-hide-ai-mode.crx` and `dist/update.xml` to your HTTPS host so
they resolve at:
- `<hostBaseUrl>/update.xml`
- `<hostBaseUrl>/avusd-hide-ai-mode.crx`

Confirm both load in a browser (the `.xml` shows XML, the `.crx` downloads). **Do
not upload `key.pem`.** Make sure the Lightspeed filter allows the host for the
Student profile.

## Google Admin — do BOTH of these on the OU
**A. Force-install the extension**
1. Admin → Devices → Chrome → Apps & extensions → Users & browsers.
2. Select the OU (pilot OU first).
3. Yellow **+** → **Add Chrome app or extension by URL**.
4. Extension ID: `igikhjlfhppkgdlhdfpggnomaicbcllo`
5. URL: your hosted `update.xml` URL.
6. Installation policy: **Force install** → Save.

**B. Disable Chrome's built-in AI Mode (the policy)**
1. Admin → Devices → Chrome → **Settings → Users & browsers**.
2. Same OU. In the settings search box, type **`AI Mode`** (Generative AI section).
3. Set it to **"Do not allow AI Mode"** (the `AIModeSettings` policy) → Save.
4. Recommended: also set **`GenAiDefaultSettings`** to "Do not allow" for breadth.

> Skipping B leaves the address-bar / in-Chrome AI Mode (`chrome://contextual-tasks`)
> fully working — the extension cannot block that surface.

## Verify on a pilot device
1. On a test student Chromebook: `chrome://policy` → **Reload policies**.
2. Confirm **`AIModeSettings`** shows value **1** (do not allow), and
   `chrome://extensions` lists **"AVUSD - Hide Google AI Mode"** as force-installed.
3. Try AI Mode from the **address bar** → it should no longer open the
   `chrome://contextual-tasks` page.
4. Run an AI Mode search on **google.com** (`udm=50`) → it should bounce to normal
   Web results. (The AI Mode tab may still be visible, but the search returns
   normal results — that's the redirect working.)

Confirm on the pilot OU before rolling out to the full Student OU.

## Maintenance
This is cat-and-mouse with Google's layout. If the button returns after a Google
change: re-confirm the `udm` value on a live device, update `AI_MODE_PARAM` /
`LABELS` in `src/content.js` and the selectors in `src/hide.css`, bump `version`
in `src/manifest.json`, rebuild with the **same** `key.pem`, and re-host the two
`dist/` files. Devices auto-update via the manifest — no Admin change needed.

## More detail
See **[DEPLOY.md](DEPLOY.md)** for the long-form deployment guide (including the
one-time Chrome Web Store alternative).
