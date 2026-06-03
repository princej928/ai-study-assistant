import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/lib/mongodb";
import Document from "@/models/Document";
import { geminiModel } from "@/lib/gemini";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const doc = await Document.findById(id);

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (doc.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!doc.extractedText?.trim()) {
      return NextResponse.json(
        { error: "No extracted text found for this document" },
        { status: 400 }
      );
    }

    const inputText = doc.extractedText.slice(0, 12000);

    const prompt = `
You are helping a student study from their notes.

Summarize the following study material into a clear, concise, exam-ready summary.
Keep it easy to revise from.

Rules:
- Use simple language
- Focus on the most important points
- Keep it well-structured
- Avoid unnecessary filler
- Keep the summary around 150 to 250 words

Study material:
${inputText}
`;

    const result = await geminiModel.generateContent(prompt);
    const summary = result.response.text().trim();

    await Document.findByIdAndUpdate(id, {
      summary,
    });

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("Summarize error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate summary";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
