import mongoose, { Schema, Document } from 'mongoose';

export interface IInterview extends Document {
  userId: string;
  vapiId?: string;
  finalized: boolean;
  type: string;
  transcript: any[];
  createdAt: Date;
}

const InterviewSchema: Schema = new Schema({
  userId: { type: String, required: true },
  vapiId: { type: String },
  finalized: { type: Boolean, default: false },
  type: { type: String },
  transcript: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IInterview>('Interview', InterviewSchema);
