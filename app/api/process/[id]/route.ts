import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Document from "@/models/Document";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectDB();

    const doc = await Document.findById(id);

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const response = await fetch(doc.fileUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch file from Cloudinary" },
        { status: 400 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    let extractedText = "";

    if (doc.fileType === "application/pdf") {
      const { extractText } = await import("unpdf");
      const result = await extractText(new Uint8Array(fileBuffer), {
        mergePages: true,
      });
      extractedText = Array.isArray(result.text)
        ? result.text.join("\n")
        : result.text;
    } else if (doc.fileType.startsWith("image/")) {
      const Tesseract = (await import("tesseract.js")).default;
      const ocrResult = await Tesseract.recognize(fileBuffer, "eng");
      extractedText = ocrResult.data.text.trim();
    } else {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    await Document.findByIdAndUpdate(id, {
      extractedText,
      status: "processed",
    });

    return NextResponse.json({ success: true, extractedText });
  } catch (error) {
    console.error("Processing error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process document";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
