import { NextResponse } from "next/server";

// The previous CSV implementation saved addresses to transient local filesystem
// storage. A real waitlist must first use consent records, retention controls
// and a durable database. Never tell visitors that a signup was saved.
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "WAITLIST_NOT_OPEN" },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
