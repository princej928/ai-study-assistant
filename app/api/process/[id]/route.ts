import { NextRequest, NextResponse, after } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Document from "@/models/Document";
import { geminiModel } from "@/lib/gemini";
import { z } from "zod";

export const runtime = "nodejs";

// Zod validation schemas
const FlashcardSchema = z.object({
  question: z.string().min(1, "Question cannot be empty"),
  answer: z.string().min(1, "Answer cannot be empty"),
});
const FlashcardsArraySchema = z.array(FlashcardSchema);

const QuizQuestionSchema = z.object({
  question: z.string().min(1, "Question cannot be empty"),
  options: z.array(z.string().min(1, "Option cannot be empty")).length(4),
  correctAnswer: z.string().min(1, "Correct answer cannot be empty"),
});
const QuizArraySchema = z.array(QuizQuestionSchema);

const DEFAULT_EASE_FACTOR = 2.5;
const DEFAULT_INTERVAL_DAYS = 1;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Parse options from body (with fallback defaults)
    const body = await req.json().catch(() => ({}));
    const quizCount = Number(body.quizCount) || 5;
    const difficulty = body.difficulty || "Medium";

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
Make the summary of ${difficulty} difficulty in terms of depth.

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
The questions should be of ${difficulty} difficulty.
Each flashcard should test a key concept, definition, formula, or fact from the material. Keep questions concise and answers clear.

Return the result as a JSON array of objects, where each object has "question" and "answer" keys.

Study material:
${inputText}
`;

        const quizPrompt = `
You are helping a student test their knowledge of their notes.

Generate exactly ${quizCount} multiple choice questions (MCQs) from the following study material.
The questions should have a difficulty level of: ${difficulty}.
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

        // Parse and validate flashcards with Zod
        const rawFlashcards = JSON.parse(flashcardsRes.response.text().trim());
        const flashcardsVal = FlashcardsArraySchema.safeParse(rawFlashcards);
        if (!flashcardsVal.success) {
          console.error("Flashcards validation error details:", flashcardsVal.error);
          throw new Error("AI generated flashcards did not match required format.");
        }
        const flashcards = flashcardsVal.data.map((card) => ({
          ...card,
          repetitions: 0,
          interval: DEFAULT_INTERVAL_DAYS,
          easeFactor: DEFAULT_EASE_FACTOR,
          nextReviewDate: new Date(),
        }));

        // Parse and validate quiz with Zod
        const rawQuiz = JSON.parse(quizRes.response.text().trim());
        const quizVal = QuizArraySchema.safeParse(rawQuiz);
        if (!quizVal.success) {
          console.error("Quiz validation error details:", quizVal.error);
          throw new Error("AI generated quiz did not match required format.");
        }
        const quiz = quizVal.data;

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
