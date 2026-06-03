"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function FileUpload() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleUpload = async (file: File) => {
    setUploading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Step 1: Upload the file
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("File upload failed on the server.");
      const data = await res.json();

      if (data.success) {
        setMessage("Uploaded! Extracting text...");

        // Step 2: Process the file (extract text)
        const processRes = await fetch(`/api/process/${data.documentId}`, {
          method: "POST",
        });
        if (!processRes.ok) throw new Error("Text extraction request failed.");
        const processData = await processRes.json();

        if (processData.success) {
          setMessage("Text extracted! Generating summary...");

          const summarizeRes = await fetch(`/api/summarize/${data.documentId}`, {
            method: "POST",
          });
          if (!summarizeRes.ok) throw new Error("Summary generation request failed.");
          const summarizeData = await summarizeRes.json();

          if (summarizeData.success) {
            setMessage("Summary generated! Creating flashcards...");

            const flashcardsRes = await fetch(`/api/flashcards/${data.documentId}`, {
              method: "POST",
            });
            if (!flashcardsRes.ok) throw new Error("Flashcards generation request failed.");
            const flashcardsData = await flashcardsRes.json();

            if (flashcardsData.success) {
              setMessage("Flashcards generated! Creating quiz...");

              const quizRes = await fetch(`/api/quiz/${data.documentId}`, {
                method: "POST",
              });
              if (!quizRes.ok) throw new Error("Quiz generation request failed.");
              const quizData = await quizRes.json();

              if (quizData.success) {
                setMessage("Done! Summary, Flashcards, & Quiz generated successfully ✅");
              } else {
                setMessage(
                  `Flashcards generated, but quiz creation failed: ${quizData.error || "Unknown error"}`
                );
              }
            } else {
              setMessage(
                `Summary generated, but flashcard creation failed: ${flashcardsData.error || "Unknown error"}`
              );
            }
          } else {
            setMessage(
              `Text extracted, but summary failed: ${summarizeData.error || "Unknown error"}`
            );
          }
        } else {
          setMessage(
            `Uploaded but text extraction failed: ${processData.error || "Unknown error"}`
          );
        }

        router.refresh();
      } else {
        setMessage("Upload failed. Try again.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage(`An error occurred: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, []);

  const renderMessage = () => {
    if (!message) return null;

    let bgStyle = "bg-slate-50 border-slate-200 text-slate-700";
    let icon = null;

    if (message.includes("✅") || message.includes("success")) {
      bgStyle = "bg-emerald-50/80 border-emerald-100 text-emerald-800";
      icon = (
        <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (message.toLowerCase().includes("failed") || message.toLowerCase().includes("error") || message.toLowerCase().includes("timeout")) {
      bgStyle = "bg-red-50/80 border-red-100 text-red-800";
      icon = (
        <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    } else {
      bgStyle = "bg-indigo-50/80 border-indigo-100 text-indigo-900";
      icon = (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></span>
        </span>
      );
    }

    return (
      <div className={`mt-6 flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border text-sm font-medium transition-all duration-300 ${bgStyle}`}>
        {icon}
        <span>{message}</span>
      </div>
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 md:p-10 text-center transition-all duration-300 cursor-pointer group flex flex-col items-center justify-center
          ${dragging 
            ? "border-indigo-500 bg-indigo-50/40 shadow-inner" 
            : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm"}`}
      >
        <div className="mb-4 bg-indigo-50 group-hover:bg-indigo-100 p-4 rounded-full text-indigo-600 transition-colors duration-300 group-hover:scale-110 active:scale-95">
          <svg
            className={`w-8 h-8 ${uploading ? "animate-pulse" : "group-hover:animate-bounce"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <p className="text-slate-600 font-semibold text-base mb-1">Drag & drop your files here</p>
        <p className="text-slate-400 text-xs mb-5">Supports PDF documents and images up to 10MB</p>

        <label className="cursor-pointer bg-indigo-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-100">
          {uploading ? "Uploading..." : "Select File"}
          <input
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            disabled={uploading}
          />
        </label>
      </div>

      {renderMessage()}
    </div>
  );
}
