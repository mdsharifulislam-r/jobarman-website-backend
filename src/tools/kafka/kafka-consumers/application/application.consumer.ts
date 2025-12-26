import { Application } from "../../../../app/modules/application/application.model";
import { ApplicationServices } from "../../../../app/modules/application/application.service";
import { INotification } from "../../../../app/modules/notification/notification.interface";
import { User } from "../../../../app/modules/user/user.model";
import { AIHelper } from "../../../../helpers/aiHelper";
import { sendNotifications } from "../../../../helpers/notificationsHelper";
import { kafkaConsumer } from "../../kafka-producers/kafka.consumer";
import { kafkaProducer } from "../../kafka-producers/kafka.producer";

export const applicationConsumer = async () => {
    await kafkaConsumer({groupId:"application",topic:"application",cb:async (data:{type:string,data:any})=>{
      try {
          switch (data.type) {
            case "create":
               const application = await ApplicationServices.createApplicationIntoDB(data.data);

               const user = await User.findOne({ _id: application?.user?._id })?.lean()
    
                const percentage = await AIHelper.getJobMatchPercentances(application?.user?._id as any,application?.post?._id as any);
               await Application.findOneAndUpdate({ _id: application?._id }, { jobMatch: percentage.matchPercentage }, { new: true });
                break;
            case "update":
              await ApplicationServices.updateApplicationStatusToDB(data.data._id, data.data.status,data.data);
                break;
            case "delete":
                await ApplicationServices.deleteApplicationFromDB(data.data._id,data.data.user);
                break;
            case "feedback":
               await ApplicationServices.feedBackOfInterview(data.data._id,data.data);
                break;
            case "autoApply":
                const {user:Iuser,percentage:percentageNumber,filePath,title} = data.data;
                const autoApply = await ApplicationServices.autoApplyForJobPosts(Iuser, filePath, title, percentageNumber,data.data._id);
                break;
            case "changeInterviewDetails":
                await ApplicationServices.changeIterviewDetailsOfApplication(data.data._id,data.data.data);
                break;
            case "cancelInterview":
                await ApplicationServices.cancelInterviewOfApplication(data.data._id,data.data?.reason);
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