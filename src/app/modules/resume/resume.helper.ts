import { AIHelper } from "../../../helpers/aiHelper";
import { openAiFileUpload } from "../../../helpers/openAiHelper";
import { User } from "../user/user.model";
import { resumeExtractorPromptMaker } from "./resume.constants";
import { IResume } from "./resume.interface";
import { ResumeExtractedData } from "./resume.model";

const extractResumeData =async (resume:IResume)=>{
    try {
        let fileId = ""
        if(resume.is_external_resume){
            fileId = await openAiFileUpload(resume.pdf as string) as string
        }
        console.log("fileId",fileId)
        const prompt = resumeExtractorPromptMaker(fileId? fileId : resume)
        const json = await AIHelper.askAI(prompt, fileId? fileId : undefined)
        await ResumeExtractedData.create({
            ...json,
            user:resume.user
        })
        await User.findByIdAndUpdate(resume.user,{
            ...json,
        })

    } catch (error) {
        console.error("Error extracting resume data:", error);
    }
}

export const ResumeHelper = {
    extractResumeData
}