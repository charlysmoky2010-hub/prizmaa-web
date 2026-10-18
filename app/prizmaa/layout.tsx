import type { Metadata } from "next";
import "./prizmaa.css";

export const metadata: Metadata = {
  title: "PRIZMAA — More human. More you.",
  description: "PRIZMAA is a privacy-first gay social and community platform in development. Friendship, belonging and consent-based connections. Public registration is not yet available.",
  robots: { index: false, follow: false },
  manifest: "/prizmaa.webmanifest",
};

export default function PrizmaaLayout({ children }: { children: React.ReactNode }) {
  return <div className="prz">{children}</div>;
}
