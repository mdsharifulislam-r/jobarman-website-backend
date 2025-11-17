import { sendNotifications } from "../../../../helpers/notificationsHelper";
import { kafkaConsumer } from "../../kafka-producers/kafka.consumer";

export const createNotificationConsumer = async () => {
    await kafkaConsumer({groupId:"notification",topic:"notification",cb:async (data:any)=>{
        console.log(data);
        
        await sendNotifications(data)
    }})
};