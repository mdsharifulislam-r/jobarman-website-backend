import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { DisclaimerService } from "./disclaimer.service";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";

const createDisclaimer = catchAsync(async (req: Request, res: Response) => {
    const { ...disclaimerData } = req.body;
    const result = await DisclaimerService.createDisclaimerToDB(disclaimerData);
   
    
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Disclaimer created successfully',
        data: result
    });
});

const getDisclaimer = catchAsync(async (req: Request, res: Response) => {
    const { type } = req.query;
    const result = await DisclaimerService.getDisclaimerToDB(type as string);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Disclaimer fetched successfully',
        data: result
    });
});

export const DisclaimerController = {
    createDisclaimer,
    getDisclaimer
}