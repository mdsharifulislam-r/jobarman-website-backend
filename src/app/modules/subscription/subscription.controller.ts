import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { SubscriptionService } from "./subscription.service";
import sendResponse from "../../../shared/sendResponse";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";


const createSubsciption = catchAsync(async (req: Request, res: Response) => {
  const { userId, receipt } = req.body;
  const subscription = await SubscriptionService.verifyAppleReceipt(
    receipt,
    userId
  );
  const response = {
    success: true,
    message: "Subscription created successfully",
    data: subscription,
    statusCode: 200,
  };
sendResponse(res, response);
});

const demoSubscription = catchAsync(async (req: Request, res: Response) => {
  const { userId, receipt } = req.body;
  const subscription = await SubscriptionService.demoSubscriptionForTest(
    receipt,
    {id:userId}
  );
  const response = {
    success: true,
    message: "Subscription created successfully",
    data: subscription,
    statusCode: 200,
  };
sendResponse(res, response);
});

const getSubscription = catchAsync(async (req: Request, res: Response) => {
  const subscription = await SubscriptionService.getSubscriptionByUser((req.user as any));
  const response = {
    success: true,
    message: "Subscription created successfully",
    data: subscription,
    statusCode: 200,
  };
sendResponse(res, response);
});

const getSubscribers = catchAsync(async (req: Request, res: Response) => {
  const subscription = await SubscriptionService.subscribedUser(req.query);
  const response = {
    success: true,
    message: "Subscription created successfully",
    data: subscription,
    statusCode: 200,
  };
sendResponse(res, response);
});

const stripeSubscription = catchAsync(async (req: Request, res: Response) => {
  const subscription = await SubscriptionService.subscribeByStripe(req.body.receipt, {id: (req.user as any)!.id as string});
  const response = {
    success: true,
    message: "Subscription created successfully",
    data: subscription,
    statusCode: 200,
  };
sendResponse(res, response);
});

const getTransactions = catchAsync(async (req: Request, res: Response) => {
  if(!req.body?.password){
    throw new ApiError(StatusCodes.BAD_REQUEST, "Password is required!");
  }
  const subscription = await SubscriptionService.transactionOfSubscription((req.user as any), req.body.password, req.query);
  const response = {
    success: true,
    message: "Otp sent successfully",
    statusCode: 200,
  };
sendResponse(res, response);
});


const getSubscribersUsers = catchAsync(async (req: Request, res: Response) => {
  const subscription = await SubscriptionService.subscriptionUsers(req.query);
  const response = {
    success: true,
    message: "Subscription created successfully",
    data: subscription.data,
    pagination: subscription.pagination,
    statusCode: 200,
  };
sendResponse(res, response);
});


const getSubscriptionDetailsById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const subscription = await SubscriptionService.getSubscriptionDetailsById(id);
  const response = {
    success: true,
    message: "Subscription created successfully",
    data: subscription,
    statusCode: 200,
  };
sendResponse(res, response);
});


const transactionByOtp = catchAsync(async (req: Request, res: Response) => {
  if(!req.query?.otp){
    throw new ApiError(StatusCodes.BAD_REQUEST, "Otp is required!");
  }
  const subscription = await SubscriptionService.transactionOfSubscriptionByOtp((req.user as any), req.query);
  const response = {
    success: true,
    message: "Get Data successfully",
    statusCode: 200,
    data: subscription.data,
    pagination: subscription.pagination
  };
sendResponse(res, response);
});

const renewSubscription = catchAsync(async (req: Request, res: Response) => {
  const subscription = await SubscriptionService.renewSubscription((req.user as any));
  const response = {
    success: true,
    message: "Get Data successfully",
    statusCode: 200,
    data: subscription
  };
sendResponse(res, response);
});

export const SubscriptionController = {
  createSubsciption,
  demoSubscription,
  getSubscription,
  getSubscribers,
  stripeSubscription,
  getTransactions,
  getSubscriptionDetailsById,
  getSubscribersUsers,
  transactionByOtp,
  renewSubscription
};