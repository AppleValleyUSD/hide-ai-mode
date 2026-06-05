// Rewrites the <updatecheck codebase="..."> in dist/update.xml to point at wherever
// you host the .crx, taken from config.json's hostBaseUrl. This keeps releases
// repeatable: set the host once, never hand-edit the URL again.
import { readFileSync, writeFileSync } from "node:fs";

const cfg = JSON.parse(readFileSync("config.json", "utf8"));
const base = String(cfg.hostBaseUrl || "").replace(/\/+$/, "");
if (!base || base.includes("REPLACE-WITH-YOUR-HTTPS-HOST")) {
  console.error("config.json: set hostBaseUrl to the HTTPS location that will serve the .crx.");
  process.exit(1);
}
const crxUrl = `${base}/avusd-hide-ai-mode.crx`;
const path = "dist/update.xml";
let xml = readFileSync(path, "utf8");
xml = xml.replace(/codebase="[^"]*"/, `codebase="${crxUrl}"`);
writeFileSync(path, xml);
console.log("update.xml codebase set to:", crxUrl);
