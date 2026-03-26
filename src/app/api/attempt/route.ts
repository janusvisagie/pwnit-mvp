export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: "Direct score submission has been retired. Refresh the page so the game can request a server-issued challenge first.",
    },
    { status: 410 },
  );
}
