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

    const prompt = `
You are helping a student test their knowledge of their notes.

Generate exactly 5 multiple choice questions (MCQs) from the following study material. 
Each question must have exactly 4 options, and there must be one correct answer which is an exact string match with one of the options.

Return the result as a JSON array of objects, where each object has these exact keys:
- "question" (string): The quiz question
- "options" (array of 4 strings): The four possible choices
- "correctAnswer" (string): The exact choice string that is the correct answer

Study material:
${inputText}
`;

    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const responseText = result.response.text().trim();
    const quiz = JSON.parse(responseText);

    await Document.findByIdAndUpdate(id, {
      quiz,
    });

    return NextResponse.json({ success: true, quiz });
  } catch (error) {
    console.error("Quiz generation error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate quiz";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
