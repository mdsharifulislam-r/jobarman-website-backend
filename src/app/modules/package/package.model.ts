import mongoose from "mongoose";
import { IPackage, PackageModel } from "./package.interface";
import { PACKAGE_TYPE } from "../../../enums/package";

const packageSchema = new mongoose.Schema<IPackage,PackageModel>({
    name: {
        type: String,
        enum:Object.values(PACKAGE_TYPE),
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    priceId: {
        type: String,
    },
    product: {
        type: String,
    },
    payment_link: {
        type: String,
    },
    for: {
        type: String,
        enum: ['employee', 'recruiter'],
    },
    features: {
        type: [String],
        required: true,
    },
    paymentId: {
        type: String,
    },
    referenceId: {
        type: String,
    },
    recurring: {
        type: String,
        enum: ['month', 'year'],
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'delete'],
        default: 'active',
    },
    interval: {
        type: Number,
        default: 1
    },
    max_applications_per_month: {
        type: Number,
        default: 10
    },
    max_resume_analyses_per_month: {
        type: Number,
        default: 1
    },
    is_chat_allowed: {
        type: Boolean,
        default: true
    },
    is_video_call_allowed: {
        type: Boolean,
        default: true
    },
    active_job_post_limit: {
        type: Number,
        default:0
    },
    max_job_duration: {
        type: Number,
        default:30
    }
},{
    timestamps: true
})


packageSchema.pre('save',async function(next){
    if(!this.active_job_post_limit && this.for=="recruiter"){
        if(this.name=="bronze"){
            this.active_job_post_limit = 2
        }else if(this.name=="silver"){
            this.active_job_post_limit = 10
        }
    }
    if(!this.is_chat_allowed && this.for=="employee"){
        if(this.name=="bronze"){
            this.is_chat_allowed = false
        }
    }
    if(!this.is_video_call_allowed){
        if(this.name=="bronze"){
            this.is_video_call_allowed = false
        }
        if(this.name=="silver" && this.for=="recruiter"){
            this.is_video_call_allowed = false
        }
    }

    if(!this.max_job_duration){
        if(this.name=="bronze"){
            this.max_job_duration = 15
        }
    }
})

export const Package = mongoose.model<IPackage, PackageModel>("Package", packageSchema);