import { Model, Types } from "mongoose";

export type ISubscription = {
    name: string;
    price: number;
    startDate: Date;
    endDate: Date;
    status: "active" | "expired";
    user: Types.ObjectId;
    txId: string;
    package?: Types.ObjectId;
    max_applications_per_month?:number
    current_month?:string // yyyy-mm
    used_applications_this_month?:number
    max_resume_analyses_per_month?:number
    is_chat_allowed?:boolean
    is_video_call_allowed?:boolean
    active_job_post_limit?:number
    max_job_duration?:number
}

export  type SubscriptionModel = Model<ISubscription, Record<string, any>>;