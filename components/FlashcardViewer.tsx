"use client";

import { useState } from "react";

export interface Flashcard {
  question: string;
  answer: string;
  repetitions: number;
  interval: number;
  easeFactor: number;
  nextReviewDate: string | Date;
}

interface FlashcardViewerProps {
  documentId: string;
  flashcards: Flashcard[];
  onFlashcardsUpdate?: (flashcards: Flashcard[]) => void;
}

const REVIEW_BUTTONS = [
  { label: "Again", rating: 1 as const, className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" },
  { label: "Hard", rating: 3 as const, className: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" },
  { label: "Good", rating: 4 as const, className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
  { label: "Easy", rating: 5 as const, className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
];

export default function FlashcardViewer({
  documentId,
  flashcards,
  onFlashcardsUpdate,
}: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");
  const [reviewTimestamp, setReviewTimestamp] = useState(() => new Date().toISOString());

  const dueCards = flashcards
    .map((card, index) => ({ ...card, originalIndex: index }))
    .filter(
      (card) => new Date(card.nextReviewDate).getTime() <= new Date(reviewTimestamp).getTime()
    );

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-xl border">
        <p className="text-gray-400">No flashcards available.</p>
      </div>
    );
  }

  const handleNavigate = (direction: "next" | "prev", e: React.MouseEvent) => {
    e.stopPropagation();
    if (dueCards.length === 0) return;

    setIsFlipped(false);
    setError("");
    setTimeout(() => {
      setCurrentIndex((prev) =>
        direction === "next"
          ? (prev + 1) % dueCards.length
          : (prev - 1 + dueCards.length) % dueCards.length
      );
    }, 150);
  };

  const handleReview = async (rating: 1 | 3 | 4 | 5) => {
    const currentCard = dueCards[currentIndex];
    if (!currentCard) return;

    setReviewing(true);
    setError("");

    try {
      const res = await fetch(`/api/flashcards/${documentId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardIndex: currentCard.originalIndex,
          rating,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save review");
      }

      const updatedCards = flashcards.map((card, index) =>
        index === currentCard.originalIndex ? data.flashcard : card
      );

      onFlashcardsUpdate?.(updatedCards);
      setIsFlipped(false);
      setReviewTimestamp(data.reviewedAt);
      setCurrentIndex((prev) => {
        const reviewedAtTime = new Date(data.reviewedAt).getTime();
        const remainingDueCount = updatedCards.filter(
          (card) => new Date(card.nextReviewDate).getTime() <= reviewedAtTime
        ).length;

        if (remainingDueCount === 0) {
          return 0;
        }

        return prev >= remainingDueCount ? 0 : prev;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save review");
    } finally {
      setReviewing(false);
    }
  };

  if (dueCards.length === 0) {
    return (
      <div className="text-center p-8 bg-emerald-50/70 rounded-2xl border border-emerald-100">
        <p className="text-emerald-700 font-semibold">All due flashcards are reviewed.</p>
        <p className="text-emerald-600/80 text-sm mt-2">
          Nice work. Come back when the next review is scheduled.
        </p>
      </div>
    );
  }

  const safeIndex = currentIndex >= dueCards.length ? 0 : currentIndex;
  const currentCard = dueCards[safeIndex];

  return (
    <div className="flex flex-col items-center justify-center py-6 w-full max-w-lg mx-auto">
      {/* 3D Flip Card Container */}
      <div
        className="w-full h-64 cursor-pointer select-none"
        style={{ perspective: "1000px" }}
        onClick={() => !reviewing && setIsFlipped(!isFlipped)}
      >
        <div
          className="relative w-full h-full duration-500 rounded-2xl shadow-sm border border-gray-200"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Front Side */}
          <div
            className="absolute inset-0 w-full h-full flex flex-col justify-between p-6 bg-gradient-to-br from-white to-blue-50/20 rounded-2xl"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <div className="text-xs font-semibold text-blue-600 tracking-wider uppercase">
              Question
            </div>
            <div className="flex-1 flex items-center justify-center text-center px-4">
              <p className="text-lg md:text-xl font-medium text-gray-800 leading-relaxed">
                {currentCard.question}
              </p>
            </div>
            <div className="text-xs text-gray-400 text-center">
              Click to flip and reveal answer
            </div>
          </div>

          {/* Back Side */}
          <div
            className="absolute inset-0 w-full h-full flex flex-col justify-between p-6 bg-blue-600 text-white rounded-2xl"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="text-xs font-semibold text-blue-200 tracking-wider uppercase">
              Answer
            </div>
            <div className="flex-1 flex items-center justify-center text-center px-4">
              <p className="text-lg md:text-xl font-medium leading-relaxed">
                {currentCard.answer}
              </p>
            </div>
            <div className="text-xs text-blue-200 text-center">
              Click to see question again
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-4 w-full rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isFlipped ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mt-6">
          {REVIEW_BUTTONS.map((button) => (
            <button
              key={button.label}
              onClick={() => handleReview(button.rating)}
              disabled={reviewing}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition disabled:opacity-50 ${button.className}`}
            >
              {reviewing ? "Saving..." : button.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between w-full mt-6 px-2">
        <button
          onClick={(e) => handleNavigate("prev", e)}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-colors"
        >
          &larr; Previous
        </button>
        <span className="text-sm text-gray-400 font-medium">
          Due Card {safeIndex + 1} of {dueCards.length}
        </span>
        <button
          onClick={(e) => handleNavigate("next", e)}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-colors"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
