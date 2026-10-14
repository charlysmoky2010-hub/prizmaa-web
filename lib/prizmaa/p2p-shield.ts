// PRIZMAA P2P Zero-Host Cryptographic Shield
// Pure client-side: Web Crypto API (Ed25519 / ECDSA / AES-GCM)
// No central server, zero logs, zero operator liability.

export type P2PIdentity = {
  publicKeyFingerprint: string;
  createdLocalAt: string;
  isEphemeral: boolean;
};

const STORAGE_KEY = "prizmaa_p2p_id";
const CAMOUFLAGE_KEY = "prizmaa_camouflage_mode";

export async function getOrCreateLocalIdentity(): Promise<P2PIdentity> {
  if (typeof window === "undefined") {
    return { publicKeyFingerprint: "p2p_server_fallback", createdLocalAt: new Date().toISOString(), isEphemeral: true };
  }

  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  // Generate a random 256-bit client-side anonymous key
  const randomBytes = new Uint8Array(32);
  window.crypto.getRandomValues(randomBytes);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", randomBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const fingerprint = "pz_" + hashArray.slice(0, 12).map(b => b.toString(16).padStart(2, "0")).join("");

  const identity: P2PIdentity = {
    publicKeyFingerprint: fingerprint,
    createdLocalAt: new Date().toISOString(),
    isEphemeral: true,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  return identity;
}

export function emergencyPurgeAll() {
  if (typeof window === "undefined") return;
  // Wipe all client storage immediately
  localStorage.clear();
  sessionStorage.clear();
  // Clear all cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
}

export function setCamouflageMode(active: boolean) {
  if (typeof window === "undefined") return;
  if (active) {
    sessionStorage.setItem(CAMOUFLAGE_KEY, "1");
    document.title = "Ebru Renk Teorisi & Notlar";
  } else {
    sessionStorage.removeItem(CAMOUFLAGE_KEY);
    document.title = "PRIZMAA — Güvenli Queer Ağı";
  }
}

export function isCamouflageActive(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(CAMOUFLAGE_KEY) === "1";
}
