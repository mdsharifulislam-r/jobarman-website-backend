import { Model, Types } from 'mongoose';

export type IMessage = {
  chatId: Types.ObjectId;
  sender: Types.ObjectId;
  text?: string;
  image?: string;
  seenBy ?: Types.ObjectId[];
  seen?: boolean;
  docs?: string[];
};

export type MessageModel = Model<IMessage, Record<string, unknown>>;
