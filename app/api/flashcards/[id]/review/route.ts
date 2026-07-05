import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import connectDB from "@/lib/mongodb";
import Document from "@/models/Document";

export const runtime = "nodejs";

const ReviewSchema = z.object({
  cardIndex: z.number().int().min(0),
  rating: z.union([z.literal(1), z.literal(3), z.literal(4), z.literal(5)]),
});

const MIN_EASE_FACTOR = 1.3;

function calculateNextReview(
  repetitions: number,
  interval: number,
  easeFactor: number,
  rating: 1 | 3 | 4 | 5
) {
  const quality = rating;

  if (quality < 3) {
    return {
      repetitions: 0,
      interval: 1,
      easeFactor: Math.max(
        MIN_EASE_FACTOR,
        easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
      ),
    };
  }

  const updatedRepetitions = repetitions + 1;
  const updatedEaseFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  let updatedInterval = 1;
  if (updatedRepetitions === 1) {
    updatedInterval = 1;
  } else if (updatedRepetitions === 2) {
    updatedInterval = 6;
  } else {
    updatedInterval = Math.max(1, Math.round(interval * updatedEaseFactor));
  }

  return {
    repetitions: updatedRepetitions,
    interval: updatedInterval,
    easeFactor: updatedEaseFactor,
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = ReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid review payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { cardIndex, rating } = parsed.data;
    const { id } = await params;

    await connectDB();

    const doc = await Document.findById(id);

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (doc.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!Array.isArray(doc.flashcards) || !doc.flashcards[cardIndex]) {
      return NextResponse.json({ error: "Flashcard not found" }, { status: 404 });
    }

    const card = doc.flashcards[cardIndex];
    const currentRepetitions = Number(card.repetitions ?? 0);
    const currentInterval = Number(card.interval ?? 1);
    const currentEaseFactor = Number(card.easeFactor ?? 2.5);

    const reviewState = calculateNextReview(
      currentRepetitions,
      currentInterval,
      currentEaseFactor,
      rating
    );

    const nextReviewDate = new Date(Date.now() + reviewState.interval * 24 * 60 * 60 * 1000);

    card.repetitions = reviewState.repetitions;
    card.interval = reviewState.interval;
    card.easeFactor = Number(reviewState.easeFactor.toFixed(2));
    card.nextReviewDate = nextReviewDate;

    doc.markModified("flashcards");
    await doc.save();

    return NextResponse.json({
      success: true,
      flashcard: card,
      reviewedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Flashcard review error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to record flashcard review";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
