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
    const formData = new FormData();
    formData.append("file", file);

    // Step 1: Upload the file
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (data.success) {
      setMessage("Uploaded! Extracting text...");

      // Step 2: Process the file (extract text)
      const processRes = await fetch(`/api/process/${data.documentId}`, {
        method: "POST",
      });
      const processData = await processRes.json();

      if (processData.success) {
        setMessage("Done! Text extracted successfully ✅");
      } else {
        setMessage(
          `Uploaded but text extraction failed: ${processData.error || "Unknown error"}`
        );
      }

      router.refresh();
    } else {
      setMessage("Upload failed. Try again.");
    }
    setUploading(false);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, []);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer
        ${dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"}`}
    >
      <p className="text-gray-500 mb-3">Drag & drop a PDF or image here</p>
      <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
        {uploading ? "Uploading..." : "Browse File"}
        <input
          type="file"
          accept=".pdf,image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          disabled={uploading}
        />
      </label>
      {message && <p className="mt-3 text-sm text-green-600">{message}</p>}
    </div>
  );
}
