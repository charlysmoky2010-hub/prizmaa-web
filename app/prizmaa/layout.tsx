import type { Metadata } from "next";
import "./prizmaa.css";
export const metadata: Metadata = {
  title: "PRIZMAA — Come as you are",
  description: "A private, consent-first social community for gay adults 18+. Invite-only beta with secure member storage.",
  robots: { index: false, follow: false },
  manifest: "/prizmaa.webmanifest",
};
export default function PrizmaaLayout({ children }: { children: React.ReactNode }) {
  return <div className="prz">{children}</div>;
}
