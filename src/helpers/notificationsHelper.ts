
import { INotification } from "../app/modules/notification/notification.interface";
import { Notification } from "../app/modules/notification/notification.model";
import { User } from "../app/modules/user/user.model";
import { USER_ROLES } from "../enums/user";

export const sendNotifications = async (
  data: INotification
): Promise<INotification> => {
  const result = await Notification.create(data);

  //@ts-ignore
  const socketIo = global.io;

  if (socketIo) {
    socketIo.emit(`get-notification::${data?.receiver![0]}`, result);
  }

  return result;
};
export const sendNotificationsAdmin = async (
  data: INotification
): Promise<INotification> => {
  

  //@ts-ignore
  const socketIo = global.io;

  const users = await User.find({ role: { $in: [USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN] } });
  const result = await Notification.create(data);

  if (socketIo) {
   users.forEach((user) => {
      socketIo.emit(`get-notification::${user._id}`, result);
    });
  }

  return result;
};




