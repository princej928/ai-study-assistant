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

Generate exactly 10 flashcard question and answer pairs from the following study material. 
Each flashcard should test a key concept, definition, formula, or fact from the material. Keep questions concise and answers clear.

Return the result as a JSON array of objects, where each object has "question" and "answer" keys.

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
    const flashcards = JSON.parse(responseText);

    await Document.findByIdAndUpdate(id, {
      flashcards,
    });

    return NextResponse.json({ success: true, flashcards });
  } catch (error) {
    console.error("Flashcard generation error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate flashcards";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
