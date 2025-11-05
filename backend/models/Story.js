import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [String],
  category: { type: String, required: true },
  targetAudience: { type: String, default: 'General' },
  language: { type: String, default: 'English' },
  status: { type: String, default: 'Ongoing', enum: ['Ongoing', 'Completed', 'Hiatus'] },
  isPublished: { type: Boolean, default: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reads: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Story', storySchema);