import { NextRequest, NextResponse } from "next/server";
import { getSurveys, getWaitlist } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const surveys = await getSurveys();
    const waitlist = await getWaitlist();
    return NextResponse.json({
      ok: true,
      stats: {
        surveyCount: surveys.length,
        waitlistCount: waitlist.length,
        earlyAccessCount: surveys.filter((s) => s.wantsEarlyAccess === "Yes")
          .length,
        creatorCount: surveys.filter((s) => s.hostsEvents === "Yes").length,
      },
      surveys,
      waitlist,
    });
  } catch (err) {
    console.error("Admin fetch failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
