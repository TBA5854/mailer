import { execSync } from "child_process";
import fs from "fs";

try {
  const currentEnv = fs.readFileSync(".env", "utf8");
  // Generate 32 bytes hex = 64 characters
  const newKey = execSync("openssl rand -hex 32").toString().trim();
  
  if (currentEnv.includes("ENCRYPTION_KEY=")) {
    // Replace existing
    const newEnv = currentEnv.replace(/ENCRYPTION_KEY=.*/, `ENCRYPTION_KEY="${newKey}"`);
    fs.writeFileSync(".env", newEnv);
  } else {
    // Append
    fs.appendFileSync(".env", `\nENCRYPTION_KEY="${newKey}"\n`);
  }
  console.log("Updated ENCRYPTION_KEY in .env");
} catch (e) {
  console.error(e);
}
