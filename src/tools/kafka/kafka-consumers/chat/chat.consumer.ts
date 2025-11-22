import { MessageService } from "../../../../app/modules/message/message.service";
import { kafkaConsumer } from "../../kafka-producers/kafka.consumer"

export const chatConsumer = async () => {
    await kafkaConsumer({groupId:"chat",topic:"chat",cb:async (data:{type:string,data:any})=>{
        try {
            switch (data.type) {
                case "create":
                    await MessageService.sendMessageToDB(data.data);
                    break;
                case "update":
                    break;
                case "delete":
                    break;
            }
        } catch (error) {
         console.log(error);
            
        }
    }})
}