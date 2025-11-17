import express from "express";
import auth from "../../middlewares/auth";
import { NotificationController } from "./notification.controller";
import { USER_ROLES } from "../../../enums/user";
const router = express.Router();

// router.get('/',
//     auth(USER_ROLES.USER),
//     NotificationController.getNotificationFromDB
// );
// router.get('/admin',
//     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
//     NotificationController.adminNotificationFromDB
// );
router.patch(
  "/:id",
  auth(),
  NotificationController.updateNotificationById
);
router.patch(
  "/",
  auth(),
  NotificationController.markAllNotification
);
router.get(
  "/",
  auth(),
  NotificationController.getAllNotification
);

// router.patch('/admin',
//     auth(USER_ROLES.USER),
//     NotificationController.adminReadNotification
// );

export const NotificationRoutes = router;
