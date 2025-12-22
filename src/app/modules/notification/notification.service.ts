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
    { receiver: {
      $in: [user.id]
    } },
    { $addToSet: { readers: user.id } },
  );
  return result;
};


// Get all notifications
const allNotificationFromDB = async (
  user: JwtPayload,
  query: Record<string, any>
) => {

if(query.date){
  query.date = new Date(query.date)

}



  const initialQuery = Notification.find({ receiver:{
    $in: [user.id],
  },...(query.date && { createdAt: { $gte: query.date } }) });

  const result = new QueryBuilder(initialQuery, query)
    .sort()
    .paginate();

  let unreadCount = await Notification.countDocuments({
    receiver: {
      $in: [user.id],
    },
    readers: {
      $nin: [user.id],
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
