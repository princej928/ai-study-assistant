import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import Document from "@/models/Document";
import FileUpload from "@/components/FileUpload";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  await connectDB();
  const docs = await Document.find({ userId }).sort({ createdAt: -1 }).lean();

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">My Study Materials</h1>
      <FileUpload />

      <div className="mt-10 grid gap-4">
        {docs.length === 0 && (
          <p className="text-gray-400 text-center mt-6">No files uploaded yet.</p>
        )}
        {docs.map((doc: any) => (
          <div key={doc._id.toString()} className="bg-white border rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="font-semibold">{doc.fileName}</p>
              <p className="text-sm text-gray-400">{doc.fileType} · {doc.status}</p>
            </div>
            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
              className="text-blue-600 text-sm hover:underline">
              View
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}