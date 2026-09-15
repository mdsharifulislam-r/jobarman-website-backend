import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { MessageService } from './message.service';
import { getMultipleFilesPath, getSingleFilePath } from '../../../shared/getFilePath';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { generateZoomLink } from '../../../helpers/zoomHelper';
import { USER_ROLES } from '../../../enums/user';
import { subscriptionHelper } from '../subscription/subscription.helper';
import ApiError from '../../../errors/ApiError';

const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const user = (req.user as any).id;
  const subscription = await subscriptionHelper.getSubscriptionBasedLimit(user?.id);
  if(user?.role==USER_ROLES.EMPLOYEE){
    if(!subscription || !subscription?.is_chat_allowed){
      throw new ApiError(403, 'You are not a premium user!! Please upgrade your subscription to use this feature.');
    }
  }

  if(req.body.type=="zoom-link" && !subscription?.is_video_call_allowed){
    throw new ApiError(403, 'You are not a premium user!! Please upgrade your subscription to use this feature.');
  }

  


  let image = getMultipleFilesPath(req.files, 'image');
  const docs = getMultipleFilesPath(req.files, 'doc');

  const payload = {
    ...req.body,
    image:image||[],
    sender: user,
    docs:docs||[],
  };
  if(payload.type=="zoom-link" && !payload.isCustom){
  const link= await generateZoomLink()
  payload.text=link;
}

  await kafkaProducer.sendMessage("chat", {type:"create",data:payload});
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Send Message Successfully',
    data: payload,
  });
});

const getMessage = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  
  const query = req.query;
  const user = (req.user as any);
  const messages = await MessageService.getMessageFromDB(id, query,user);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Message Retrieve Successfully',
    data: messages,
  });
});

export const MessageController = { sendMessage, getMessage };
