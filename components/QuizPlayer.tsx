"use client";

import { useState } from "react";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface QuizPlayerProps {
  quiz: QuizQuestion[];
}

export default function QuizPlayer({ quiz }: QuizPlayerProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  if (!quiz || quiz.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-slate-400">No quiz questions available.</p>
      </div>
    );
  }

  const currentQuestion = quiz[currentIdx];

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
  };

  const handleNext = () => {
    if (selectedOption === null) return;

    const newAnswers = [...answers, selectedOption];
    setAnswers(newAnswers);
    setSelectedOption(null);

    if (currentIdx < quiz.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleRetake = () => {
    setCurrentIdx(0);
    setAnswers([]);
    setSelectedOption(null);
    setShowResults(false);
  };

  const score = answers.reduce((acc, ans, idx) => {
    return ans === quiz[idx].correctAnswer ? acc + 1 : acc;
  }, 0);

  if (showResults) {
    const percentage = Math.round((score / quiz.length) * 100);

    return (
      <div className="w-full max-w-2xl mx-auto py-6">
        {/* Score Header Card */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50/50 rounded-2xl border border-indigo-100 p-8 text-center shadow-sm mb-8">
          <div className="text-xs font-semibold text-indigo-600 tracking-wider uppercase mb-2">
            Quiz Complete
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            Here's how you did!
          </h2>

          {/* Radial score circle */}
          <div className="relative w-36 h-36 mx-auto flex items-center justify-center mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-slate-200"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-indigo-600 transition-all duration-1000 ease-out"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 64}
                strokeDashoffset={2 * Math.PI * 64 * (1 - percentage / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-slate-800">
                {score}/{quiz.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {percentage}% Score
              </span>
            </div>
          </div>

          <button
            onClick={handleRetake}
            className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 active:scale-95 transition shadow-md shadow-indigo-100"
          >
            Retake Quiz
          </button>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800 px-1">
            Question Breakdown
          </h3>

          {quiz.map((q, idx) => {
            const userAnswer = answers[idx];
            const isCorrect = userAnswer === q.correctAnswer;

            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
              >
                <div className="flex items-start gap-3 mb-4">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isCorrect
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <h4 className="text-base font-semibold text-slate-800 leading-relaxed pt-0.5">
                    {q.question}
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = userAnswer === opt;
                    const isCorrectOption = q.correctAnswer === opt;

                    let cardStyle = "border-slate-200 bg-slate-50/30 text-slate-700";
                    let badge = "";

                    if (isCorrectOption) {
                      cardStyle = "border-green-500 bg-green-50/50 text-green-900 font-medium";
                      badge = "Correct Answer";
                    } else if (isSelected && !isCorrect) {
                      cardStyle = "border-red-400 bg-red-50/50 text-red-900";
                      badge = "Your Answer (Incorrect)";
                    } else if (isSelected) {
                      badge = "Your Answer";
                    }

                    return (
                      <div
                        key={oIdx}
                        className={`relative rounded-xl border p-4 text-sm flex flex-col justify-center transition-all ${cardStyle}`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{opt}</span>
                          {badge && (
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                isCorrectOption
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {badge}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const progressPercentage = ((currentIdx + 1) / quiz.length) * 100;

  return (
    <div className="w-full max-w-lg mx-auto py-6 flex flex-col justify-between min-h-[420px]">
      <div>
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            Question {currentIdx + 1} of {quiz.length}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {Math.round(progressPercentage)}% Complete
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Question Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
          <p className="text-lg font-bold text-slate-800 leading-relaxed">
            {currentQuestion.question}
          </p>
        </div>

        {/* Options List */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const letter = String.fromCharCode(65 + idx); // A, B, C, D
            const isSelected = selectedOption === option;

            return (
              <button
                key={idx}
                onClick={() => handleOptionClick(option)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left text-sm transition-all duration-200 group active:scale-[0.99] ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-700"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                  }`}
                >
                  {letter}
                </span>
                <span className="font-medium pt-0.5">{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleNext}
          disabled={selectedOption === null}
          className={`px-6 py-2.5 font-semibold rounded-xl shadow-md transition-all duration-200 ${
            selectedOption !== null
              ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 active:scale-95 cursor-pointer"
              : "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed"
          }`}
        >
          {currentIdx === quiz.length - 1 ? "Submit Quiz" : "Next Question"}
        </button>
      </div>
    </div>
  );
}
