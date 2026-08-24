"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FlashcardViewer, { Flashcard } from "./FlashcardViewer";
import QuizPlayer, { QuizQuestion } from "./QuizPlayer";

interface Doc {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  extractedText: string;
  summary: string;
  improvementSuggestions: string[];
  flashcards: Flashcard[];
  quiz?: QuizQuestion[];
  status: string;
}

interface DocumentCardProps {
  document: Doc;
}

export default function DocumentCard({ document }: DocumentCardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"summary" | "suggestions" | "flashcards" | "quiz" | "text">("summary");
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [summary, setSummary] = useState(document.summary || "");
  const [improvementSuggestions] = useState<string[]>(document.improvementSuggestions || []);
  const [flashcards, setFlashcards] = useState<Flashcard[]>(document.flashcards || []);
  const [quiz, setQuiz] = useState<QuizQuestion[]>(document.quiz || []);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${document._id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        alert(data.error || "Failed to delete document");
      }
    } catch {
      alert("Error deleting document");
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const res = await fetch(`/api/summarize/${document._id}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        router.refresh();
      } else {
        alert(data.error || "Failed to generate summary");
      }
    } catch {
      alert("Error generating summary");
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    setGeneratingFlashcards(true);
    try {
      const res = await fetch(`/api/flashcards/${document._id}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setFlashcards(data.flashcards);
        router.refresh();
      } else {
        alert(data.error || "Failed to generate flashcards");
      }
    } catch {
      alert("Error generating flashcards");
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setGeneratingQuiz(true);
    try {
      const res = await fetch(`/api/quiz/${document._id}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setQuiz(data.quiz);
        router.refresh();
      } else {
        alert(data.error || "Failed to generate quiz");
      }
    } catch {
      alert("Error generating quiz");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const renderFileTypeBadge = (type: string) => {
    const isPDF = type.includes("pdf");
    const isImage = type.startsWith("image/");

    let style = "bg-slate-50 text-slate-700 border-slate-200/50";
    let icon = (
      <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
    let label = "DOCUMENT";

    if (isPDF) {
      style = "bg-rose-50 text-rose-700 border-rose-200/40";
      icon = (
        <svg className="w-3.5 h-3.5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
      label = "PDF";
    } else if (isImage) {
      style = "bg-emerald-50 text-emerald-700 border-emerald-200/40";
      icon = (
        <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a1 1 0 011.414 0L16 17m0 0l-4-4m-9-3h18a2 2 0 002-2V5a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
      label = "IMAGE";
    }

    return (
      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full border font-semibold tracking-wide ${style}`}>
        {icon}
        <span>{label}</span>
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-100 hover:translate-y-[-2px] transition-all duration-300">
      {/* Document Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h3 className="font-semibold text-gray-800 text-lg">{document.fileName}</h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {renderFileTypeBadge(document.fileType)}
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-400 font-medium">Status: {document.status}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
          <a
            href={document.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View File
          </a>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition disabled:opacity-50"
          >
            {deleting ? (
              <span className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-100 mt-4">
        <button
          onClick={() => setActiveTab("summary")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
            activeTab === "summary"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Summary
        </button>
        <button
          onClick={() => setActiveTab("suggestions")}
          className={`flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
            activeTab === "suggestions"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Study Tips
        </button>
        <button
          onClick={() => setActiveTab("flashcards")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
            activeTab === "flashcards"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
          Flashcards
        </button>
        <button
          onClick={() => setActiveTab("quiz")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
            activeTab === "quiz"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Quiz
        </button>
        <button
          onClick={() => setActiveTab("text")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
            activeTab === "text"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          Extracted Text
        </button>
      </div>

      {/* Tab Content */}
      <div className="py-5 min-h-[200px] flex flex-col">
        {/* Tab 1: Summary */}
        {activeTab === "summary" && (
          <div className="flex-1 flex flex-col">
            {generatingSummary ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-3 text-sm text-gray-500">Generating summary using Gemini...</p>
              </div>
            ) : summary ? (
              <div className="text-gray-700 text-sm md:text-base leading-relaxed whitespace-pre-line bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                {summary}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-10 border border-dashed border-gray-200 rounded-xl bg-gray-50/30">
                <p className="text-gray-400 text-sm mb-4">No summary generated for this document yet.</p>
                <button
                  onClick={handleGenerateSummary}
                  disabled={!document.extractedText}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Summary
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "suggestions" && (
          <div className="flex-1">
            {improvementSuggestions.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">Use these focused actions to strengthen your revision.</p>
                <ul className="space-y-3">
                  {improvementSuggestions.map((suggestion, index) => (
                    <li key={suggestion} className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-4 text-sm leading-relaxed text-slate-700">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">{index + 1}</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/30 px-6 text-center text-sm text-gray-400">
                Process this document again to generate personalised study tips.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Flashcards */}
        {activeTab === "flashcards" && (
          <div className="flex-1 flex flex-col">
            {generatingFlashcards ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-3 text-sm text-gray-500">Generating 10 flashcards using Gemini...</p>
              </div>
            ) : flashcards && flashcards.length > 0 ? (
              <FlashcardViewer
                documentId={document._id}
                flashcards={flashcards}
                onFlashcardsUpdate={setFlashcards}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-10 border border-dashed border-gray-200 rounded-xl bg-gray-50/30">
                <p className="text-gray-400 text-sm mb-4">No flashcards generated for this document yet.</p>
                <button
                  onClick={handleGenerateFlashcards}
                  disabled={!document.extractedText}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Flashcards
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Quiz */}
        {activeTab === "quiz" && (
          <div className="flex-1 flex flex-col">
            {generatingQuiz ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-3 text-sm text-gray-500">Generating 5 quiz questions using Gemini...</p>
              </div>
            ) : quiz && quiz.length > 0 ? (
              <QuizPlayer quiz={quiz} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-10 border border-dashed border-gray-200 rounded-xl bg-gray-50/30">
                <p className="text-gray-400 text-sm mb-4">No quiz generated for this document yet.</p>
                <button
                  onClick={handleGenerateQuiz}
                  disabled={!document.extractedText}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Quiz
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Extracted Text */}
        {activeTab === "text" && (
          <div className="flex-1 flex flex-col">
            {document.extractedText ? (
              <div className="max-h-64 overflow-y-auto text-gray-600 text-xs md:text-sm bg-gray-50 p-4 rounded-xl border border-gray-100 font-mono leading-normal whitespace-pre-line">
                {document.extractedText}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-10">
                <p className="text-gray-400 text-sm">No extracted text found. Make sure the document processing completed.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
