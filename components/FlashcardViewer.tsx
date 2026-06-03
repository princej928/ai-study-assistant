"use client";

import { useState } from "react";

interface Flashcard {
  question: string;
  answer: string;
}

interface FlashcardViewerProps {
  flashcards: Flashcard[];
}

export default function FlashcardViewer({ flashcards }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-xl border">
        <p className="text-gray-400">No flashcards available.</p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    }, 150); // wait for unflip transition
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150); // wait for unflip transition
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 w-full max-w-lg mx-auto">
      {/* 3D Flip Card Container */}
      <div
        className="w-full h-64 cursor-pointer select-none"
        style={{ perspective: "1000px" }}
        onClick={() => setIsFlipped(!isFlipped)}
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

      {/* Navigation Controls */}
      <div className="flex items-center justify-between w-full mt-6 px-2">
        <button
          onClick={handlePrev}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-colors"
        >
          &larr; Previous
        </button>
        <span className="text-sm text-gray-400 font-medium">
          Card {currentIndex + 1} of {flashcards.length}
        </span>
        <button
          onClick={handleNext}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-colors"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
