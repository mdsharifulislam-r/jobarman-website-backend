import { Model } from "mongoose";

export type ISpotlightPrice = {
    price: number;
    status:"active" | "inactive";
}


export type ISpotlightModel = Model<ISpotlightPrice>;

export type ICompanyInfo = {
    company_name: string;
    company_address: string;
    job_url: string;
    company_logo: string;
    contact_email: string;
}


export type CompanyInfoModel = Model<ICompanyInfo>;