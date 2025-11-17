import { Request, Response, NextFunction } from 'express';
import { CategoryServices } from './category.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { getSingleFilePath } from '../../../shared/getFilePath';
const createCategory = catchAsync(async (req: Request, res: Response) => {
    const { ...categoryData } = req.body;
    const image = getSingleFilePath(req.files, 'image');
    categoryData.image = image
    const result = await CategoryServices.createCategoryInDB(categoryData);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Category created successfully',
        data: result
    });
})
const getAllCategory = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryServices.getAllCategoryFromDB();
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Categories fetched successfully',
        data: result
    });
})
const updateCategory = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { ...categoryData } = req.body;
    const image = getSingleFilePath(req.files, 'image');
    categoryData.image = image
    const result = await CategoryServices.updateCategoryInDB(id, categoryData);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Category updated successfully',
        data: result
    });
})
const deleteCategory = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await CategoryServices.deleteCategoryFromDB(id);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Category deleted successfully',
        data: result
    });
})
export const CategoryController = {
    createCategory,
    getAllCategory,
    updateCategory,
    deleteCategory
};
