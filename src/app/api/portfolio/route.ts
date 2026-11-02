import { NextRequest, NextResponse } from "next/server";
import { getPortfolioData, savePortfolioData, PortfolioData } from "@/lib/portfolio";
import { isFirebaseConfigured } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getPortfolioData();
    // Mask PIN for security & return firebase status
    const safeData = {
      ...data,
      adminPin: "********",
      firebaseConnected: isFirebaseConfigured(),
    };
    return NextResponse.json(safeData);
  } catch (error) {
    console.error("Failed to load portfolio:", error);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const currentData = await getPortfolioData();

    // Verify PIN
    if (body.pin !== currentData.adminPin) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস! অনুগ্রহ করে সঠিক পিন দিন।" },
        { status: 401 }
      );
    }

    // Merge updated fields
    const updatedData: PortfolioData = {
      profile: body.profile || currentData.profile,
      services: body.services !== undefined ? body.services : currentData.services || [],
      skills: body.skills !== undefined ? body.skills : currentData.skills,
      projects: body.projects !== undefined ? body.projects : currentData.projects,
      testimonials: body.testimonials !== undefined ? body.testimonials : currentData.testimonials || [],
      experience: body.experience !== undefined ? body.experience : currentData.experience,
      adminPin: body.newPin && body.newPin.trim() ? body.newPin.trim() : currentData.adminPin,
      messages: currentData.messages || [],
    };

    await savePortfolioData(updatedData);

    return NextResponse.json({
      success: true,
      message: "পোর্টফোলিও সফলভাবে আপডেট হয়েছে!",
    });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Failed to update portfolio data" }, { status: 500 });
  }
}
