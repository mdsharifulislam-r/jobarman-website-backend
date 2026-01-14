import { Request, Response, NextFunction } from 'express';
import { ResumeServices } from './resume.service';
import catchAsync from '../../../shared/catchAsync';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { cleanObject } from '../../../helpers/cleanObject';
import { getSingleFilePath } from '../../../shared/getFilePath';

const createResume = catchAsync(async (req: Request, res: Response) => {
    const { ...resumeData } = req.body;
    resumeData.user = (req.user as any).id
    await kafkaProducer.sendMessage("resume", {type:"create",data:resumeData});
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Resume created successfully',
        data: resumeData
    });
})

const updateResume = catchAsync(async (req: Request, res: Response) => {
    const { ...resumeData } = req.body;
    const id = req.params.id;
    resumeData._id = id;

    
    await kafkaProducer.sendMessage("resume", {type:"update",data:cleanObject(resumeData)});
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Resume updated successfully',
        data: resumeData
    });
})

const deleteResume = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    await kafkaProducer.sendMessage("resume", {type:"delete",data:{_id:id}});
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Resume deleted successfully',
    });
})

const getAllResumes = catchAsync(async (req: Request, res: Response) => {
    const result = await ResumeServices.getAllResumeFromDB(req.query, (req.user as any));
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Resume fetched successfully',
        data: result.data,
        pagination: result.pagination
    });
})


const getResume = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await ResumeServices.getResumeByIdFromDB(id);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Resume fetched successfully',
        data: result
    });
})


const createResumeIntoExternalPdf =catchAsync(async (req: Request, res: Response) => {
    const { ...resumeData } = req.body;
    const pdf = getSingleFilePath(req.files, 'resume');
    const resume  = await ResumeServices.createResumeIntoExternalPdf({
        ...resumeData,
        user: (req.user as any).id,
        pdf: pdf,
        resume_name: resumeData?.name
    });
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Resume created successfully',
        data: resumeData
    });
})

const updateResumeExternalPdf =catchAsync(async (req: Request, res: Response) => {
    const { ...resumeData } = req.body;
    const id = req.params.id;
    const pdf = getSingleFilePath(req.files, 'resume');
    const resume  = await ResumeServices.updateResumeExternalPdf(id, {
        ...resumeData,
        pdf: pdf,
        resume_name: resumeData?.name
    });
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Resume updated successfully',
        data: resume
    });
})

export const ResumeController = {
    createResume,
    updateResume,
    deleteResume,
    getAllResumes,
    getResume,
    createResumeIntoExternalPdf,
    updateResumeExternalPdf
};
