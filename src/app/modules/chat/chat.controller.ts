import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { ChatService } from "./chat.service";

const createChat = catchAsync(async (req: Request, res: Response) => {
    const user = (req.user as any);
    const otherUser = req.params.id;

    const participants = [user?.id, otherUser];
    const chat = await ChatService.createChatToDB(participants);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Create Chat Successfully',
        data: chat,
    });
})

const getChat = catchAsync(async (req: Request, res: Response) => {
    const user = (req.user as any);
    const search = req.query.searchTerm as string;
    const chatList = await ChatService.getChatFromDB(user, search);
  
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Chat Retrieve Successfully',
        data: chatList
    });
});

const singleChatDetails = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const chat = await ChatService.singleChatDetails(id, (req.user as any));
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Chat Retrieve Successfully',
        data: chat
    });
})
export const ChatController = { 
    createChat, 
    getChat,
    singleChatDetails
};