#!/usr/bin/env bun

import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import pack from "libnpmpack";
import { sign } from "sigstore";

async function main() {
  if (!process.env.CI) {
    console.log("Not in CI, skipping");
    process.exit(0);
  }

  // Pack the package
  const tarball = await pack();
  console.log("Packed tarball");

  // Calculate hash
  const hash = createHash("sha256").update(tarball).digest("hex");
  console.log("SHA256:", hash);

  // Sign with Sigstore (uses OIDC from CI)
  const bundle = await sign(tarball);
  const bundleJson = JSON.stringify(bundle, null, 2);
  console.log("Signed and bundled:", bundleJson);

  // Submit to Rekor
  const response = await fetch(
    "https://rekor.sigstore.dev/api/v1/log/entries",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kind: "hashedrekord",
        apiVersion: "0.0.1",
        spec: bundle,
      }),
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to submit to Rekor: ${response.statusText}`);
  }
  const entry = await response.json();
  console.log("Submitted to Rekor:", entry.logIndex);

  // Optionally save bundle
  await fs.writeFile("provenance.bundle.json", bundleJson);
  console.log("Bundle saved to provenance.bundle.json");
}

main().catch(console.error);
