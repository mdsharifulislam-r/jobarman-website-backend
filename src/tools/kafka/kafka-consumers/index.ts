import { applicationConsumer } from "./application/application.consumer";
import { chatConsumer } from "./chat/chat.consumer";
import { createChatbotConsumer } from "./chatbot/chatbot.consumer";
import { createNotificationConsumer } from "./notification/notification.consumer";
import { postConsumer } from "./post/post.consumer";
import { ResumeConsumer } from "./resume/create.resume.consumer";
import { userConsumer } from "./user.consumer";

export async function loadConsumer() {
    await Promise.all([postConsumer(),ResumeConsumer(),applicationConsumer(),createNotificationConsumer(),chatConsumer()]);
    console.log('consumer loaded');
    
}