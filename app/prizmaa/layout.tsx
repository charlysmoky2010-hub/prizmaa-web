import type { Metadata } from "next";
import "./prizmaa.css";
export const metadata: Metadata = {
  title: "PRIZMAA — Come as you are",
  description: "A privacy-first adult gay dating, flirting and hookup app. Private local MVP for adults 18+.",
  robots: { index: false, follow: false },
  manifest: "/prizmaa.webmanifest",
};
export default function PrizmaaLayout({ children }: { children: React.ReactNode }) {
  return <div className="prz">{children}</div>;
}
