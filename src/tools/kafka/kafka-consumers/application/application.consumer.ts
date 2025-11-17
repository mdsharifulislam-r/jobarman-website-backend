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

               const user = await User.findOne({ _id: application.user })?.lean()
               await sendNotifications({
                title:`Your application for ${application.title} has been submitted!`,
                message:`Your application for ${application.title} has been submitted!`,
                isRead:false,
                filePath:"application",
                receiver:[application.user],
                referenceId:application._id
               })
               await sendNotifications({
                   title:`New application for ${application.title} has been submitted!`,
                   message:`${user?.name}  has submitted an application for ${application.title}`,
                   isRead:false,
                   filePath:"application",
                   receiver:[application.post as any],
                   referenceId:application._id
               })
                const percentage = await AIHelper.getJobMatchPercentances(application.user as any,application.post as any);
               await Application.findOneAndUpdate({ _id: application._id }, { jobMatch: percentage.matchPercentage }, { new: true });
                break;
            case "update":
                break;
            case "delete":
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