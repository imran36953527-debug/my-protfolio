import { NextRequest, NextResponse } from "next/server";
import { getPortfolioData, savePortfolioData } from "@/lib/portfolio";

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "অনুগ্রহ করে সবগুলো তথ্য সঠিকভাবে পূরণ করুন।" }, { status: 400 });
    }

    const data = await getPortfolioData();
    const newMessage = {
      id: "msg-" + Date.now(),
      name,
      email,
      message,
      createdAt: new Date().toISOString(),
    };

    data.messages = [newMessage, ...(data.messages || [])];
    await savePortfolioData(data);

    return NextResponse.json({ success: true, message: "আপনার মেসেজ সফলভাবে পাঠানো হয়েছে!" });
  } catch (error) {
    return NextResponse.json({ error: "মেসেজ পাঠানো ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get("pin");
    const data = await getPortfolioData();

    if (pin !== data.adminPin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ messages: data.messages || [] });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { pin, id } = await req.json();
    const data = await getPortfolioData();

    if (pin !== data.adminPin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    data.messages = (data.messages || []).filter((m) => m.id !== id);
    await savePortfolioData(data);

    return NextResponse.json({ success: true, message: "মেসেজ ডিলিট করা হয়েছে।" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
