import { headers } from "next/headers";
import { isPrivateBetaRuntime } from "@/lib/prizmaa/security-policy";
import BetaClient from "./client";
import "./beta.css";

export default async function PrizmaaBeta() {
  const h = await headers();
  const host = h.get("host") || "";
  const hostname = host.startsWith("[") ? host.split("]")[0] + "]" : host.split(":")[0];
  const local = isPrivateBetaRuntime(process.env, hostname, host);

  if (!local) {
    return (
      <main className="prizmaa-beta">
        <div className="prizmaa-wrap">
          <header className="prizmaa-nav"><span className="prizmaa-logotype">PRIZMAA<span>✦</span></span><span className="prizmaa-chip">PRIVATE DEVELOPMENT</span></header>
          <section className="prizmaa-hero">
            <div className="prizmaa-orb" aria-hidden="true"><i/><i/><i/></div>
            <div>
              <p className="prizmaa-eyebrow">A safer way to find your people</p>
              <h1>Real connections.<br/><em>On your terms.</em></h1>
              <p className="prizmaa-lead">A privacy-first social and dating space for adult gay and queer men. Member registration is not publicly available during development.</p>
              <div className="prizmaa-rules"><span>18+ only</span><span>Privacy by default</span><span>No public profiles</span></div>
              <p className="prizmaa-small">Development preview. No live community, verified member population, or paid access is claimed.</p>
            </div>
          </section>
        </div>
      </main>
    );
  }
  return <BetaClient />;
}
