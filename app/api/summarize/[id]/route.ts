import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Document from "@/models/Document";
import { geminiModel } from "@/lib/gemini";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();

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

    const summaryLength = doc.summaryLength || "Medium";

    let lengthRule = "";
    if (summaryLength === "Short") {
      lengthRule = "- Keep the summary short (around 80 to 120 words)\n- Focus on key high-level bullet points only";
    } else if (summaryLength === "Long") {
      lengthRule = "- Keep the summary detailed (around 350 to 450 words)\n- Provide a section-by-section breakdown of the key concepts";
    } else {
      lengthRule = "- Keep the summary around 150 to 250 words\n- Focus on the most important points";
    }

    const prompt = `
You are helping a student study from their notes.

Summarize the following study material into a clear, concise, exam-ready summary.
Keep it easy to revise from.

Rules:
- Use simple language
- Keep it well-structured
- Avoid unnecessary filler
${lengthRule}

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
