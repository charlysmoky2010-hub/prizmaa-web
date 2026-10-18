import { redirect } from "next/navigation";

// No public member beta while persistent storage, age assurance and
// moderation are not production-ready.
export default function PrizmaaBetaRedirect() {
  redirect("/prizmaa");
}
