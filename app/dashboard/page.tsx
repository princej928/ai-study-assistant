import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Document from "@/models/Document";
import User from "@/models/User";
import FileUpload from "@/components/FileUpload";
import DocumentCard from "@/components/DocumentCard";
import { Flashcard } from "@/components/FlashcardViewer";
import { QuizQuestion } from "@/components/QuizPlayer";
import SignOutButton from "@/components/SignOutButton";

interface DashboardDocument {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  extractedText: string;
  summary: string;
  improvementSuggestions: string[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  status: string;
}

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/sign-in");

  await connectDB();
  const user = await User.findById(userId).lean();
  const rawDocs = await Document.find({ userId }).sort({ createdAt: -1 }).lean();
  
  // Serialize Mongo documents for Client Components
  const docs: DashboardDocument[] = rawDocs.map((doc) => ({
    _id: doc._id.toString(),
    fileName: doc.fileName,
    fileUrl: doc.fileUrl,
    fileType: doc.fileType,
    extractedText: doc.extractedText || "",
    summary: doc.summary || "",
    improvementSuggestions: doc.improvementSuggestions || [],
    flashcards: doc.flashcards || [],
    quiz: doc.quiz || [],
    status: doc.status || "uploaded",
  }));

  const totalDocs = docs.length;
  const totalFlashcards = docs.reduce((acc, doc) => acc + doc.flashcards.length, 0);
  const totalSummarized = docs.filter((doc) => !!doc.summary).length;
  const totalQuizzes = docs.filter((doc) => doc.quiz.length > 0).length;

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-100 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md shadow-indigo-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              StudyForge
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-500 hidden sm:inline-block">
              Study Hub
            </span>
            <SignOutButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
        
        {/* Welcome Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 text-white rounded-3xl p-8 shadow-xl shadow-indigo-100/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Welcome back, {user?.name || "Student"}! 👋
            </h1>
            <p className="text-indigo-100 max-w-xl">
              Turn your lecture notes, textbooks, and images into clear summaries, interactive flashcards, and personalized practice quizzes instantly.
            </p>
          </div>
          <div className="z-10 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-center shadow-lg">
              <p className="text-xs text-indigo-200 font-semibold uppercase tracking-wider">Plan</p>
              <p className="text-lg font-bold mt-0.5">StudyForge Premium</p>
            </div>
          </div>
          {/* Subtle background decoration */}
          <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>
          <div className="absolute left-0 bottom-0 -mb-12 -ml-12 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white border border-slate-100 p-5 md:p-6 rounded-2xl shadow-sm flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-400">Total Materials</p>
              <p className="text-xl md:text-2xl font-bold text-slate-800">{totalDocs}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-5 md:p-6 rounded-2xl shadow-sm flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-400">Summarized</p>
              <p className="text-xl md:text-2xl font-bold text-slate-800">{totalSummarized} / {totalDocs}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-5 md:p-6 rounded-2xl shadow-sm flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-400">Flashcards</p>
              <p className="text-xl md:text-2xl font-bold text-slate-800">{totalFlashcards}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-5 md:p-6 rounded-2xl shadow-sm flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-400">Practice Quizzes</p>
              <p className="text-xl md:text-2xl font-bold text-slate-800">{totalQuizzes} / {totalDocs}</p>
            </div>
          </div>
        </div>

        {/* Upload Container */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Upload Study Material
          </h2>
          <FileUpload />
        </div>

        {/* Documents Grid/List */}
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Your Library
          </h2>
          <div className="grid gap-6">
            {docs.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-3xl bg-white/40">
                <svg className="w-14 h-14 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
                <p className="text-slate-600 font-bold text-lg">Your library is empty</p>
                <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
                  Drag and drop a PDF or photograph of your notes above. We will handle the rest!
                </p>
              </div>
            ) : (
              docs.map((doc) => (
                <DocumentCard key={doc._id} document={doc} />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
