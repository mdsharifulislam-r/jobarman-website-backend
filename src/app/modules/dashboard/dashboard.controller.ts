import { Request, Response, NextFunction } from 'express';
import { DashboardServices } from './dashboard.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';

const getSummuryFromDb = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardServices.getSummuryFromDb();
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Dashboard summary fetched successfully',
        data: result
    })
});

const getWeeklyReport = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardServices.weeklyReportFromDB();
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Weekly report fetched successfully',
        data: result
    })
})


const monthlyReport = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardServices.monthlyReportFromDB(req.query?.year as any);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Monthly report fetched successfully',
        data: result
    })
})


const getManuallyReport = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardServices.manualSearchDetails(req.query?.startDate as any, req.query?.endDate as any);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Manually report fetched successfully',
        data: result
    })
})
export const DashboardController = {
    getSummuryFromDb,
    getWeeklyReport,
    monthlyReport,
    getManuallyReport
};
