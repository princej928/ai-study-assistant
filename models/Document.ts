import mongoose from "mongoose";

const FlashcardSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    repetitions: { type: Number, default: 0 },
    interval: { type: Number, default: 1 },
    easeFactor: { type: Number, default: 2.5 },
    nextReviewDate: { type: Date, default: Date.now },
  },
  { _id: false }
);

const QuizQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: { type: [String], default: [] },
    correctAnswer: { type: String, required: true },
  },
  { _id: false }
);

const DocumentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, required: true },
  extractedText: { type: String, default: "" },
  summary: { type: String, default: "" },
  summaryLength: { type: String, default: "Medium" },
  flashcards: { type: [FlashcardSchema], default: [] },
  quiz: { type: [QuizQuestionSchema], default: [] },
  status: { type: String, default: "uploaded" },
  error: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Document || mongoose.model("Document", DocumentSchema);
