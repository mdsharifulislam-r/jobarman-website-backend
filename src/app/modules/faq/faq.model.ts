import { model, Schema } from "mongoose";
import { FaqModel, IFaq } from "./faq.interface";

const faqSchema = new Schema<IFaq,FaqModel>({
    answer:{
        type:String,
        required:true
    },
    question:{
        type:String,
        required:true
    }
},{
    timestamps:true
})

export const Faq = model<IFaq,FaqModel>('Faq',faqSchema)