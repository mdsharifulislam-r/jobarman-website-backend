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
}

export type PackageModel = Model<IPackage>