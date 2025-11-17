import { JwtPayload } from "jsonwebtoken";
import { Notification } from "./notification.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { Types } from "mongoose";

// Just for single notification update to db
const updateNotificationToDB = async (id: string,user:JwtPayload) => {
  const result = await Notification.findOneAndUpdate(
    { _id: id, readers: { $nin: [new Types.ObjectId(user.id)] }},
    { $addToSet: { readers: user.id } },
    { new: true }
  );
  return result;
};


// Mark all notifications as read
const markAllNotificationsAsRead = async (user: JwtPayload) => {

const userObjectId = new Types.ObjectId(user.id)
  const result = await Notification.updateMany(
    { isRead: false, receiver: {
      $in: [userObjectId]
    } },
    { $set: { isRead: true,$push: { readers: userObjectId } } },
  );
  return result;
};


// Get all notifications
const allNotificationFromDB = async (
  user: JwtPayload,
  query: Record<string, any>
) => {
  const userObjectId = new Types.ObjectId(user.id);

  const initialQuery = Notification.find({ receiver:{
    $in: [userObjectId]
  } });

  const result = new QueryBuilder(initialQuery, query)
    .sort()
    .paginate();

  let unreadCount = await Notification.countDocuments({
    isRead: false,
    readers: {
      $nin: [userObjectId]
    },
  });

 const [data, pagination] = await Promise.all([
    result.modelQuery.lean(),
    result.getPaginationInfo()
 ])

  return {
    pagination,
    data:{
      unreadCount,
      data:data?.map((notification:any) => ({
        ...notification,
        isRead: notification.readers?.map((reader: any) => reader.toString())?.includes(user?.id),
      }))
    },
  };
};

export const NotificationService = {

  updateNotificationToDB,
  allNotificationFromDB,
  markAllNotificationsAsRead,
};
