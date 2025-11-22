
import path from "path";
import fs from "fs";
import ApiError from "../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { chatbot } from "../config/open-ai.config";

export const openAiFileUpload = async (file: string) => {
try {
        const filePath = path.join(process.cwd(), 'uploads', file);
        const extName = path.extname(filePath);
        if(!['.pdf'].includes(extName)){
            return "image"
        }
    const response = await chatbot.files.create({
        file:fs.createReadStream(filePath) ,
        purpose: "assistants",
    });
    console.log(response);
    
    return response.id;
} catch (error) {
    return null;
}
};