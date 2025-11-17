import { model, Schema, Types } from "mongoose";
import { INotification, NotificationModel } from "./notification.interface";

const notificationSchema = new Schema<INotification, NotificationModel>(
  {
    title: {
      type: String,
      required: true,
    },
    receiver: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    message: {
      type: String,
      required: true,
    },

    filePath: {
      type: String,
      enum: ["application", "post", "job", "recruiter", "user"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
    },
    readers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ]
  },
  {
    timestamps: true,
  }
);

export const Notification = model<INotification, NotificationModel>(
  "Notification",
  notificationSchema
);
