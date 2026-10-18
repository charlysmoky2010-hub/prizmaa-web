// Fail-closed commercial/social boundary for PRIZMAA's local-only prototype.
// Never turn on internet-facing membership based on NODE_ENV or platform flags.
export function isPrivateBetaRuntime(
  env: Readonly<Record<string, string | undefined>>,
  urlHostname: string,
  hostHeader: string,
): boolean {
  if (env.VERCEL || env.ALLOW_PUBLIC_PREVIEW === "1" || env.PRIZMAA_LOCAL_MVP !== "1") {
    return false;
  }
  if (!["localhost", "127.0.0.1", "[::1]"].includes(urlHostname)) {
    return false;
  }
  return /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(hostHeader);
}

export const VIP_UPGRADE_BLOCKED = Object.freeze({
  status: 403,
  error: "PAYMENT_PROOF_REQUIRED",
  explanation: "A checkout URL or a client request cannot grant a paid entitlement.",
});

// The owner must later implement verified live payment+refund webhook processing,
// persistent production storage, age assurance, and moderation before launch.
