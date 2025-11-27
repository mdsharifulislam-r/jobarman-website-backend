import { Request, Response, NextFunction } from 'express';
import { SupportServices } from './support.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { getMultipleFilesPath } from '../../../shared/getFilePath';
const createSupport = catchAsync(async (req: Request, res: Response) => {
    const { ...supportData } = req.body;
    const images = getMultipleFilesPath(req.files, 'image');
    const docs = getMultipleFilesPath(req.files, 'doc');
    supportData.images = images;
    supportData.docs = docs;
    supportData.user = (req.user as any).id;
    const result = await SupportServices.createSupportIntoDB(supportData);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Support created successfully',
        data: result
    });
})
const getAllSupport = catchAsync(async (req: Request, res: Response) => {
    const result = await SupportServices.getAllSupport(req.query);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Support fetched successfully',
        data: result.data,
        pagination: result.pagination
    });
})

const deleteSupport = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await SupportServices.deleteSupportFromDB(id);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Support deleted successfully',
        data: result
    });
})

const replySupport = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const body = req.body;
    const result = await SupportServices.replySupport(id, body);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Support deleted successfully',
        data: result
    });
})
export const SupportController = {
    createSupport,
    getAllSupport,
    deleteSupport,
    replySupport
}
