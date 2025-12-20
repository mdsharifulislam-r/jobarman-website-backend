import { Schema, model } from 'mongoose';
import { IMessage, MessageModel } from './message.interface';

const messageSchema = new Schema<IMessage, MessageModel>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Chat',
    },
    sender: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    text: { 
      type: String,
      required: false 
    },
    image: { 
    type: [String],
      required: false 
    },
    seenBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    docs:[
      {
        type: String,
    }],
    type:{
      type:String,
      enum:['text','image','document','zoom-link'],
      required:false,
      default:'text'
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ chatId: 1 });

export const Message = model<IMessage, MessageModel>('Message', messageSchema);
