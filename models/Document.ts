import mongoose from 'mongoose'

const DocumentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, required: true },
  extractedText: { type: String, default: '' },
  summary: { type: String, default: '' },
  flashcards: { type: Array, default: [] },
  quiz: { type: Array, default: [] },
  status: { type: String, default: 'uploaded' },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.Document || mongoose.model('Document', DocumentSchema)
