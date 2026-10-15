import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { registerEntitySecretCiphertext, initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

const apiKey = process.env.CIRCLE_API_KEY!;
if (!apiKey) { console.error("CIRCLE_API_KEY not set"); process.exit(1); }

const entitySecret = crypto.randomBytes(32).toString("hex");

const recoveryDir = "/home/user/app/.circle";
fs.mkdirSync(recoveryDir, { recursive: true });

try {
  const response = await registerEntitySecretCiphertext({
    apiKey,
    entitySecret,
    recoveryFileDownloadPath: recoveryDir,
  });

  const recoveryPath = path.join(recoveryDir, "recovery_file.dat");
  if (response.data?.recoveryFile) {
    fs.writeFileSync(recoveryPath, response.data.recoveryFile);
  }

  // Persist to .env
  const envPath = "/home/user/app/.env";
  fs.appendFileSync(envPath, `\nCIRCLE_ENTITY_SECRET=${entitySecret}\n`, "utf-8");

  // Verify
  const client = initiateDeveloperControlledWalletsClient({ apiKey, entitySecret });
  await client.listWalletSets({ pageSize: 1 });

  console.log("SUCCESS");
  console.log("recovery_path=" + recoveryPath);
} catch (e: unknown) {
  console.error("FAILED", e instanceof Error ? e.message : String(e));
  process.exit(1);
}
