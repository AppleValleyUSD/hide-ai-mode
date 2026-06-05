# Deploying the AI Mode hider (self-hosted force-install)

Force-installing a self-hosted extension needs just two files reachable over HTTPS
by the Chromebooks: the signed `.crx` and an `update.xml` manifest pointing at it.
Use any HTTPS location your devices can reach and you control. Everything here is
pre-built and pre-signed — you are HOSTING two files and pasting one URL into Admin.

## Bundle contents
- `dist/avusd-hide-ai-mode.crx`  <- signed extension. HOST THIS.
- `dist/update.xml`              <- update manifest. HOST THIS.
- `key.pem`                      <- PRIVATE signing key. KEEP SECRET. Never host,
                                    never commit. Needed only to sign future
                                    versions; if it leaks, anyone can sign an
                                    update your managed devices would trust.

Extension ID (fixed, derived from key.pem): igikhjlfhppkgdlhdfpggnomaicbcllo

## Step 1 - Build
1. Set `hostBaseUrl` in `config.json` to the HTTPS base URL that will serve the
   .crx (the folder the two files will live in).
2. Run `npm install` then `npm run build`. This produces `dist/avusd-hide-ai-mode.crx`
   and `dist/update.xml` with its `codebase` already set to
   `<hostBaseUrl>/avusd-hide-ai-mode.crx`.

## Step 2 - Host the two files
Upload `dist/avusd-hide-ai-mode.crx` and `dist/update.xml` to your HTTPS host so
they resolve at:
  <hostBaseUrl>/update.xml
  <hostBaseUrl>/avusd-hide-ai-mode.crx
Do NOT upload key.pem. Confirm both URLs load in a browser (the .xml shows XML,
the .crx downloads).

## Step 3 - Force-install in Google Admin
1. Admin -> Devices -> Chrome -> Apps & extensions -> Users & browsers.
2. Select the Student OU.
3. Yellow "+" -> Add Chrome app or extension by URL.
4. Extension ID: igikhjlfhppkgdlhdfpggnomaicbcllo
5. URL: your hosted update.xml URL
6. Installation policy: Force install. Save.
Pilot on a small test OU first, confirm, then roll to the full Student OU.

## Step 3b - REQUIRED: disable Chrome's built-in AI Mode (policy)
AI Mode comes in TWO surfaces. The extension only covers the google.com web page
(udm=50). Chrome ALSO has AI Mode built into the address bar / new-tab search box,
which on ChromeOS opens an internal chrome://contextual-tasks/ page. Extensions
cannot run on chrome:// pages, so the extension is powerless there - you must turn
it off with a policy.
1. Admin -> Devices -> Chrome -> Settings -> Users & browsers.
2. Select the same OU.
3. Search settings for "AI Mode" (in the Generative AI section).
4. Set to "Do not allow AI Mode" (policy: AIModeSettings = 1). Save.
5. Recommended: also set GenAiDefaultSettings to "Do not allow" for breadth.
Without this step, AI Mode in the address bar keeps working no matter what the
extension does. Both pieces are required.

## Step 4 - Allow the host in the filter
The Chromebooks must reach your HTTPS host to fetch the manifest and .crx. Confirm
Lightspeed isn't blocking it for the Student profile. Pair with the udm=50 block
(NOT udm=14) for defense in depth.

## Verify on a device
On a test student Chromebook: chrome://policy -> Reload policies. Then:
- Confirm AIModeSettings shows value 1 (do not allow), and chrome://extensions
  lists "AVUSD - Hide Google AI Mode" as force-installed.
- Try AI Mode from the ADDRESS BAR - it should no longer open the
  chrome://contextual-tasks page (that's policy Step 3b working).
- Run an AI Mode search on google.com (udm=50) - it should bounce to normal Web
  results (that's the extension working). The in-page AI Mode tab may still be
  visible, but the search returns normal results.

Tip: the omnibox can show a "google.com/search?...udm=50" URL while the page is
actually chrome://contextual-tasks - check the real URL with location.href in
DevTools if a page that looks like google.com isn't being caught by the extension.
That mismatch means it's the in-Chrome surface (needs the policy), not the web one.

## Future versions
Edit files in `src/`, bump `version` in `src/manifest.json`, run `npm run build`
again (SAME key.pem, so the ID stays the same), and re-host the two `dist/` files.
Devices auto-update via the manifest; no Admin change needed.

## Easiest alternative if someone can pay once
The Chrome Web Store publishing account doesn't have to be yours. If anyone with a
payment-authorized account registers the dev account once ($5), the .crx can be
uploaded as a Private/domain-restricted item and force-installed by ID - then
there's no hosting to maintain at all. Worth a one-line ask before standing up a
host.
