import { Schema, model } from 'mongoose';
import { ISupport, SupportModel } from './support.interface'; 
import { getRandomId } from '../../../shared/getRandomId';

const supportSchema = new Schema<ISupport, SupportModel>({
  reason: { type: String, required: true },
  description: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  images: { type: [String], required: false },
  docs: { type: [String], required: false },
  status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
  supportId: { type: String, required: false },
  reply: { type: String, required: false },
},{
  timestamps: true
});

supportSchema.pre('save', function (next) {
  this.supportId = getRandomId('SUPPORT-', 6, 'number');
  next();
});

export const Support = model<ISupport, SupportModel>('Support', supportSchema);
