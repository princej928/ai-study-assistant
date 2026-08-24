import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import connectDB from "@/lib/mongodb";
import Document from "@/models/Document";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "ai-study-assistant",
      },
      (error, result) => {
        if (error) reject(error);
        else if (result?.secure_url) resolve({ secure_url: result.secure_url });
        else reject(new Error("Cloudinary did not return an uploaded file URL"));
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

  return NextResponse.json({ success: true, document: doc, documentId: doc._id });
}
