import { IApplication } from "../../../../app/modules/application/application.interface";
import { Application } from "../../../../app/modules/application/application.model";
import { AIHelper } from "../../../../helpers/aiHelper";
import { kafkaConsumer } from "../../kafka-producers/kafka.consumer";

export const createChatbotConsumer = async () => {
    type type = "job-match" | "resume-match" | "application-match" | "auto-apply" | "calculate-job-match";
    await kafkaConsumer({groupId:"chatbot",topic:"chatbot",cb:async (data:{type:type,data:any})=>{
        try {
            switch (data.type) {
                case "job-match":
                    break;
                case "resume-match":
                    break;
                case "application-match":
                    break;
                case "auto-apply":
                    break;
                case "calculate-job-match":
                    const application:IApplication = data.data;
                    const percentage = await AIHelper.getJobMatchPercentances(application.user as any,application.post as any);
                    await Application.findOneAndUpdate({ _id: (application as any)._id }, { jobMatch: percentage.matchPercentage }, { new: true });
                    break;
                default:
                    console.log("Invalid type");
                    break;
            }
        } catch (error) {
            console.log(error);
            
        }
    }})
};