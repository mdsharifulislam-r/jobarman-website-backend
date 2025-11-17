import { Model } from "mongoose";

export type IPackage = {
    name: string,
    price: number;
    priceId?: string,
    payment_link?: string,
    product?: string,
    for:"exployee"|"recruiter",
    features: string[];
    status: "active" | "delete";
    paymentId: string
    referenceId: string,
    recurring:"month"|"year"|"week"
}

export type PackageModel = Model<IPackage>