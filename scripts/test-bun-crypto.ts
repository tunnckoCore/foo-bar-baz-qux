import * as crypto from "node:crypto"; // Use node:crypto for Bun's compatibility layer

async function testSigstoreSignLogic() {
  try {
    const EC_KEYPAIR_TYPE = "ec";
    const P256_CURVE = "prime256v1"; // or secp256k1, etc.

    // Simulate key generation
    const { privateKey } = crypto.generateKeyPairSync(EC_KEYPAIR_TYPE, {
      namedCurve: P256_CURVE,
    });

    const dataToSign = Buffer.from("some data to be signed");

    console.log(
      "Attempting to sign with crypto.sign(null, data, privateKey)...",
    );
    // This is the problematic line from @sigstore/sign
    const signature = crypto.sign(null, dataToSign, privateKey);
    console.log(
      "Signature generated successfully (without specified digest):",
      signature.toString("hex"),
    );
  } catch (e: any) {
    console.error("An error occurred during signing:");
    console.error("Error name:", e.name);
    console.error("Error message:", e.message);
    console.error("Error code:", (e as any).code);
    console.error("Stack:", e.stack);
  }
}

testSigstoreSignLogic();
