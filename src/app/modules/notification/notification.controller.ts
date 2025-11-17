import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { NotificationService } from "./notification.service";
import { JwtHeader } from "jsonwebtoken";

// single one update notification
const updateNotificationById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user;
    const result = await NotificationService.updateNotificationToDB(id,user!);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Notification updated successfully",
      data: result,
    });
  }
);

const getAllNotification = catchAsync(async (req: Request, res: Response) => {
 
  
  const user = req.user;

  const result = await NotificationService.allNotificationFromDB(
    user!,
    req.query
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notification retrieved successfully",
    data: result.data,
    pagination: result.pagination,
  });
});

const markAllNotification = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtHeader;
  const result = await NotificationService.markAllNotificationsAsRead(user);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notification updated successfully",
    data: result,
  });
});

export const NotificationController = {
  updateNotificationById,
  getAllNotification,
  markAllNotification,
};
