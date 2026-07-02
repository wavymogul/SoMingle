import crypto from "crypto";

// Apple Music (MusicKit) developer token — a short-ish-lived ES256 JWT signed
// with your MusicKit private key (.p8). Generated server-side so the key never
// ships to the browser; the resulting token is safe to hand to MusicKit JS.

export function appleConfigured(): boolean {
  return Boolean(
    process.env.APPLE_TEAM_ID &&
      process.env.APPLE_KEY_ID &&
      process.env.APPLE_PRIVATE_KEY
  );
}

const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString("base64url");

export function buildDeveloperToken(): string {
  const teamId = process.env.APPLE_TEAM_ID as string;
  const keyId = process.env.APPLE_KEY_ID as string;
  // Allow the PEM to be stored with literal "\n" in the env var.
  const privateKey = (process.env.APPLE_PRIVATE_KEY as string).replace(
    /\\n/g,
    "\n"
  );

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: keyId, typ: "JWT" };
  const payload = {
    iss: teamId,
    iat: now,
    exp: now + 60 * 60 * 24 * 180, // 180 days (Apple max is 6 months)
  };

  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(
    JSON.stringify(payload)
  )}`;

  // ES256 requires the raw r||s signature encoding (ieee-p1363), not DER.
  const signature = crypto.sign("SHA256", Buffer.from(signingInput), {
    key: privateKey,
    dsaEncoding: "ieee-p1363",
  });

  return `${signingInput}.${b64url(signature)}`;
}
