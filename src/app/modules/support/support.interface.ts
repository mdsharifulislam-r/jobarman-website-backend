import { Model, Types } from 'mongoose';

export type ISupport = {
  reason: string;
  description: string;
  user: Types.ObjectId;
  images: string[];
  docs: string[];
  supportId: string;
  status : 'pending' | 'resolved',
  reply?: string
};

export type SupportModel = Model<ISupport>;
