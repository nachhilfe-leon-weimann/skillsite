import { NextResponse } from "next/server";

import { healthReport } from "@/lib/health";

// The running container has to answer, not a prerendered file: the deploy reads
// the version from here to prove the new image is the one serving.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(healthReport(), {
    headers: { "Cache-Control": "no-store" },
  });
}
