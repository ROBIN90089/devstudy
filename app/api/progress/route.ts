import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Pool } from "pg";
import { randomBytes } from "node:crypto";
import { sanitizeProgress, emptyProgress } from "@/lib/progress";
export const runtime = "nodejs";
const globalPool = globalThis as unknown as { studyPool?: Pool };
function pool() {
  return (globalPool.studyPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  }));
}
async function session() {
  const c = await cookies();
  let id = c.get("devstudy-session")?.value;
  if (!id || !/^[a-f0-9]{64}$/.test(id)) {
    id = randomBytes(32).toString("hex");
    c.set("devstudy-session", id, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return id;
}
export async function GET() {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ mode: "local", progress: null });
  try {
    const id = await session();
    const r = await pool().query(
      "SELECT data FROM study_progress WHERE session_id=$1",
      [id],
    );
    return NextResponse.json({
      mode: "database",
      progress: r.rows[0]?.data ?? emptyProgress,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Progress storage is unavailable. Your browser copy is preserved.",
      },
      { status: 503 },
    );
  }
}
export async function PUT(request: Request) {
  if (
    request.headers.get("origin") !==
    (process.env.APP_ORIGIN ??
      `${new URL(request.url).protocol}//${request.headers.get("host")}`)
  )
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ mode: "local" });
  try {
    const text = await request.text();
    if (text.length > 2000000)
      return NextResponse.json(
        { error: "Progress too large" },
        { status: 413 },
      );
    const progress = sanitizeProgress(JSON.parse(text));
    const id = await session();
    await pool().query(
      "INSERT INTO study_progress (session_id,data) VALUES ($1,$2) ON CONFLICT (session_id) DO UPDATE SET data=EXCLUDED.data,updated_at=NOW()",
      [id, JSON.stringify(progress)],
    );
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to save progress" },
      { status: 400 },
    );
  }
}
