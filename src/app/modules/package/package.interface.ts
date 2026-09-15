import { Model } from "mongoose";
import { PACKAGE_TYPE } from "../../../enums/package";

export type IPackage = {
    name: PACKAGE_TYPE,
    price: number;
    priceId?: string,
    payment_link?: string,
    product?: string,
    for:"employee"|"recruiter",
    features: string[];
    status: "active" | "delete";
    paymentId: string
    referenceId: string,
    recurring:"month"|"year"|"week",
    interval?:number
    max_applications_per_month?:number
    max_resume_analyses_per_month?:number
    is_chat_allowed?:boolean
    is_video_call_allowed?:boolean,
    active_job_post_limit?:number,
    max_job_duration?:number
}

export type PackageModel = Model<IPackage>