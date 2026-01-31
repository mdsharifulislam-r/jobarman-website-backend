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
},{
    timestamps: true
})

export const Package = mongoose.model<IPackage, PackageModel>("Package", packageSchema);