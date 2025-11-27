import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { MessageService } from './message.service';
import { getMultipleFilesPath, getSingleFilePath } from '../../../shared/getFilePath';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';

const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const user = (req.user as any).id;


  let image = getSingleFilePath(req.files, 'image');
  const docs = getMultipleFilesPath(req.files, 'doc');

  const payload = {
    ...req.body,
    image:image||'',
    sender: user,
    docs:docs||[],
  };

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
