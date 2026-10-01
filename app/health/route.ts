import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Used by the container HEALTHCHECK and `docker compose up --wait`: 200 only
// when the database answers, so a deploy that cannot reach Postgres fails.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
