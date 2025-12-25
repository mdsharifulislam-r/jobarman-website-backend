import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AdminService } from './admin.service';

const createAdmin = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await AdminService.createAdminToDB(payload);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Admin created Successfully',
        data: result
    });
});

const deleteAdmin = catchAsync(async (req: Request, res: Response) => {
    const payload = req.params.id;
    const result = await AdminService.deleteAdminFromDB(payload);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Admin Deleted Successfully',
        data: result
    });

});

const getAdmin = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;

    const result = await AdminService.getAdminFromDB(query);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Admin Retrieved Successfully',
        data: result.resultData,
        pagination: result.paginationInfo
    });

});

const updateAdminInfo = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body;
    const result = await AdminService.updateAdminInfo(id, payload);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Admin Updated Successfully',
        data: result
    });
});


const createPriceForSpotlight = catchAsync(async (req: Request, res: Response) => {
    const { price } = req.body;
    const result = await AdminService.createPriceForSpotlight(price);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Spotlight Price Updated Successfully',
        data: result
    });
});

const getCurrentPriceForSpotlight = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.currentPriceForSpotlight();
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Spotlight Price Fetched Successfully',
        data: result
    });
});

const getCompanyInfoForExpiredJobs = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const result = await AdminService.getCompanyInfoForExpiredJobs(query);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Company Info for Expired Jobs Retrieved Successfully',
        data: result.companies,
        pagination: result.pagination
    });
});

export const AdminController = {
    deleteAdmin,
    createAdmin,
    getAdmin,
    updateAdminInfo,
    createPriceForSpotlight,
    getCurrentPriceForSpotlight,
    getCompanyInfoForExpiredJobs
};