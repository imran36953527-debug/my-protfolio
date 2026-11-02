import { NextRequest, NextResponse } from "next/server";
import { getPortfolioData } from "@/lib/portfolio";

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    const data = await getPortfolioData();

    if (pin && pin === data.adminPin) {
      return NextResponse.json({ success: true, authorized: true });
    }

    return NextResponse.json({ success: false, error: "ভুল পাসওয়ার্ড বা পিন!" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
