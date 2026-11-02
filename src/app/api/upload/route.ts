import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { storage, isFirebaseConfigured } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Allowed image and video mime types
    const validImageTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "image/avif",
    ];

    const validVideoTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime", // .mov
      "video/ogg",
      "video/x-matroska", // .mkv
      "video/x-msvideo", // .avi
    ];

    const isImage = validImageTypes.includes(file.type);
    const isVideo = validVideoTypes.includes(file.type);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          error:
            "Invalid file format. Please upload photos (JPG, PNG, WEBP, GIF) or videos (MP4, WEBM, MOV).",
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${Date.now()}-${sanitizedName}`;

    // 1. Try Firebase Storage if configured (Ideal for Netlify serverless hosting)
    if (isFirebaseConfigured() && storage) {
      try {
        const storageRef = ref(storage, `uploads/${uniqueFileName}`);
        await uploadBytes(storageRef, buffer, { contentType: file.type });
        const firebaseUrl = await getDownloadURL(storageRef);

        return NextResponse.json({
          success: true,
          url: firebaseUrl,
          mediaType: isVideo ? "video" : "image",
          originalName: file.name,
          size: file.size,
          storage: "firebase",
        });
      } catch (firebaseErr) {
        console.error("Firebase Storage upload error, falling back to local:", firebaseErr);
      }
    }

    // 2. Fallback to local storage (Development & Local PC)
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, uniqueFileName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueFileName}`;
    return NextResponse.json({
      success: true,
      url: publicUrl,
      mediaType: isVideo ? "video" : "image",
      originalName: file.name,
      size: file.size,
      storage: "local",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file. Please try again." },
      { status: 500 }
    );
  }
}
