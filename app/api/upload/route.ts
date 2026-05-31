import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import cloudinary from "@/lib/cloudinary";
import connectDB from "@/lib/mongodb";
import Document from "@/models/Document";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadResult = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "ai-study-assistant",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });

  await connectDB();
  const doc = await Document.create({
    userId,
    fileName: file.name,
    fileUrl: uploadResult.secure_url,
    fileType: file.type,
    status: "uploaded",
  });

  return NextResponse.json({ success: true, document: doc });
}