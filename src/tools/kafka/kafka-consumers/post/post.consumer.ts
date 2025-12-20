import { PostServices } from "../../../../app/modules/post/post.service";
import { kafkaConsumer } from "../../kafka-producers/kafka.consumer";

export const postConsumer = async () => {
    await kafkaConsumer({ groupId: "post", topic: "post", cb:async (data: {type:string,data:any}) => {
        try {
                    switch (data.type) {
            case "create":
                await PostServices.createPostIntoDB(data.data);
                break;
            case "update":
                await PostServices.updatePostToDB(data.data._id,data.data);
                break;
            case "delete":
                await PostServices.deletePostFromDB(data.data._id);
                break;
            case "bulk_insert":
                await PostServices.bulkInsertPostIntoDB(data.data);
                break;
        }
        } catch (error) {
            console.log(error);
            
        }
    }})
}