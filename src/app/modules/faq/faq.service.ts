import { IFaq } from "./faq.interface";
import { Faq } from "./faq.model";

const createFaqToDB = async (data:IFaq)=>{
    const createFaq = await Faq.create(data)

    return createFaq
}


const updateFaqToDB = async (id:string,data:Partial<IFaq>)=>{
    const updateFaq = await Faq.findOneAndUpdate({_id:id},data,{new:true})

    return updateFaq

}

const deleteFaqFromDb = async (id:string)=>{
    const deletFaq = await Faq.findOneAndDelete({_id:id})
    return deletFaq
}

const getFaqs = async ()=>{
    return await Faq.find().lean()
}

export const FaqService = {
    createFaqToDB,
    updateFaqToDB,
    deleteFaqFromDb,
    getFaqs
}