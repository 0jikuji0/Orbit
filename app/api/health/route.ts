import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Toujours exécutée à la demande (jamais mise en cache au build).
export const dynamic = "force-dynamic";

/** Sonde de santé pour Docker / le reverse proxy : l'application répond et la base aussi. */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "ok" });
  } catch {
    return NextResponse.json({ status: "error", database: "unreachable" }, { status: 503 });
  }
}
