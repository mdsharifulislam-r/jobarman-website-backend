import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { FaqService } from "./faq.service";
import sendResponse from "../../../shared/sendResponse";

const createFaq = catchAsync(
  async  (req:Request,res:Response)=>{
        const faq = await FaqService.createFaqToDB(req.body)
        sendResponse(res,{
            statusCode: 200,
            data:faq,
            message:"Faq create successfully",
            success:true
        })
    }
)

const updateFaq = catchAsync(
    async (req:Request,res:Response)=>{
        const id = req.params.id
        const data = req.body
        const update = await FaqService.updateFaqToDB(id,data)
        sendResponse(res,{
            statusCode:200,
            message:"update successfully",
            success:true,
            data:update
        })
    }
)

const deleteFaq  = catchAsync(
    async (req:Request,res:Response)=>{
        const id = req.params.id
        await FaqService.deleteFaqFromDb(id)
        sendResponse(res,{
            statusCode:200,
            message:"delete successfully",
            success:true,
        }
        )
    }
    
)

const getAllFaqs = catchAsync(
    async (req:Request,res:Response)=>{
        const result = await FaqService.getFaqs()
        sendResponse(res,{
            statusCode:200,
            message:"get all faqs",
            success:true,
            data:result
        })
    }
)

export const FaqController={createFaq,getAllFaqs,updateFaq,deleteFaq}