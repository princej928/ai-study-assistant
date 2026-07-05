import { NextRequest, NextResponse, after } from "next/server";
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

    // Mark status as extracting and clear any previous errors
    await Document.findByIdAndUpdate(id, {
      status: "extracting",
      error: "",
    });

    // Run the long-running processing flow in the background
    after(async () => {
      try {
        await connectDB();

        // 1. Fetch the file buffer from Cloudinary
        const response = await fetch(doc.fileUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch file from Cloudinary");
        }

        const arrayBuffer = await response.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);

        let extractedText = "";

        // 2. Perform Text Extraction or OCR
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
          throw new Error("Unsupported file type");
        }

        if (!extractedText.trim()) {
          throw new Error("No text could be extracted from this document");
        }

        // Save extracted text and progress state to summarization
        await Document.findByIdAndUpdate(id, {
          extractedText,
          status: "summarizing",
        });

        // 3. Generate Summary using Gemini
        const inputText = extractedText.slice(0, 12000);
        const summaryPrompt = `
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
        const summaryResult = await geminiModel.generateContent(summaryPrompt);
        const summary = summaryResult.response.text().trim();

        // Save summary and progress state to generating study assets
        await Document.findByIdAndUpdate(id, {
          summary,
          status: "generating_assets",
        });

        // 4. Generate Flashcards & Quiz (Concurrently)
        const flashcardsPrompt = `
You are helping a student study from their notes.

Generate exactly 10 flashcard question and answer pairs from the following study material. 
Each flashcard should test a key concept, definition, formula, or fact from the material. Keep questions concise and answers clear.

Return the result as a JSON array of objects, where each object has "question" and "answer" keys.

Study material:
${inputText}
`;

        const quizPrompt = `
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

        const [flashcardsRes, quizRes] = await Promise.all([
          geminiModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: flashcardsPrompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
            }
          }),
          geminiModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: quizPrompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
            }
          })
        ]);

        const flashcards = JSON.parse(flashcardsRes.response.text().trim());
        const quiz = JSON.parse(quizRes.response.text().trim());

        // Update database with completed status and all generated assets
        await Document.findByIdAndUpdate(id, {
          flashcards,
          quiz,
          status: "completed",
        });

      } catch (err) {
        console.error("Background processing error:", err);
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred during background processing";
        
        await Document.findByIdAndUpdate(id, {
          status: "failed",
          error: errorMessage,
        });
      }
    });

    return NextResponse.json({ success: true, message: "Processing started" });
  } catch (error) {
    console.error("Initiation error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to initiate document processing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
