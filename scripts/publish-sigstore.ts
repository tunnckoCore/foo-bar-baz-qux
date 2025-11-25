#!/usr/bin/env bun

import { spawn } from "child_process";
import fs from "node:fs/promises";
import pack from "libnpmpack";

async function main() {
  if (!process.env.CI) {
    console.log("Not in CI, skipping");
    process.exit(0);
  }

  // Pack the package
  const tarball = await pack();
  console.log("Packed tarball");

  // Save tarball
  await fs.writeFile("package.tgz", tarball);
  console.log("Tarball saved as package.tgz");

  // Sign with Sigstore CLI (handles OIDC, Fulcio, Rekor)
  const sigstore = spawn(
    "./sigstore",
    ["sign", "package.tgz", "--output", "provenance.bundle.json"],
    {
      stdio: "inherit",
    }
  );

  sigstore.on("close", async (code) => {
    if (code === 0) {
      const file = Bun.file("provenance.bundle.json");
      const bundle = await file.text();

      console.log("Bundle:", JSON.stringify(JSON.parse(bundle), null, 2));
      console.log("");
      console.log(
        "Signed and submitted to Rekor. Bundle saved to provenance.bundle.json"
      );
    } else {
      console.error("Sigstore CLI failed");
      process.exit(1);
    }
  });
}

main().catch(console.error);
