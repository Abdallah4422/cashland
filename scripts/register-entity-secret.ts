import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { registerEntitySecretCiphertext, initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

const apiKey = process.env.CIRCLE_API_KEY;
if (!apiKey) { console.error("CIRCLE_API_KEY not set"); process.exit(1); }

const entitySecret = crypto.randomBytes(32).toString("hex");

const recoveryDir = "/home/user/app/.circle";
fs.mkdirSync(recoveryDir, { recursive: true });

console.log("[1/3] Registering entity secret with Circle...");
const response = await registerEntitySecretCiphertext({
  apiKey,
  entitySecret,
  recoveryFileDownloadPath: recoveryDir,
});

const recoveryPath = path.join(recoveryDir, "recovery_file.dat");
if (response.data?.recoveryFile) {
  fs.writeFileSync(recoveryPath, response.data.recoveryFile);
  console.log("[2/3] Recovery file written to", recoveryPath);
} else {
  console.log("[2/3] Recovery file path:", recoveryPath);
}

const envPath = "/home/user/app/.env";
fs.appendFileSync(envPath, `\nCIRCLE_ENTITY_SECRET=${entitySecret}\n`, "utf-8");
console.log("[2/3] CIRCLE_ENTITY_SECRET written to .env");

console.log("[3/3] Verifying registration...");
const client = initiateDeveloperControlledWalletsClient({ apiKey, entitySecret });
await client.listWalletSets({ pageSize: 1 });
console.log("[3/3] Verification successful — entity secret is registered.");
console.log("REGISTRATION_COMPLETE");
