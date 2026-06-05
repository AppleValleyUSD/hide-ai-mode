# AVUSD — Hide Google AI Mode

A tiny, self-hosted Chrome/ChromeOS extension that removes Google Search's **AI
Mode** for the district's Student OU. Force-installed via the Google Admin
console.

## What it does
- If a search page loads in AI Mode (`udm=50`), it **redirects** to the normal
  AI-free Web results (`udm=14`) so the AI Mode page never renders.
- It **hides** the AI Mode pill/tab and AI Overview blocks from the results page
  as Google rebuilds the DOM.
- Scoped to `google.com` only. No data collection, no extra permissions.

## Why we can't just flip a setting
Google serves AI Mode to Workspace for Education accounts marked **under 18**
regardless of Admin console settings, and there is **no native Admin switch** for
the in-page AI Mode tab — it's part of core Google Search, not a Chrome policy.
A force-installed extension that hides/redirects it is the only working lever.
(We verified the native controls first — age-based access set to under-18, GenAI
policy defaults, Text Capture, Lens region search, Search & Assistant all denied
on the Student OU — and none of them turn off the in-page AI Mode tab.)

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

## Force-install in Google Admin
1. Admin → Devices → Chrome → Apps & extensions → Users & browsers.
2. Select the OU (pilot OU first).
3. Yellow **+** → **Add Chrome app or extension by URL**.
4. Extension ID: `igikhjlfhppkgdlhdfpggnomaicbcllo`
5. URL: your hosted `update.xml` URL.
6. Installation policy: **Force install** → Save.

## Verify on a pilot device
1. On a test student Chromebook: `chrome://policy` → **Reload policies**.
2. `chrome://extensions` should list **"AVUSD - Hide Google AI Mode"** as
   force-installed.
3. Run an AI Mode search (a `udm=50` URL): it should bounce to normal Web results
   and the **AI Mode pill should be gone**.

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
