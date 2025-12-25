import { model, Schema } from "mongoose";
import { CompanyInfoModel, ICompanyInfo, ISpotlightModel, ISpotlightPrice } from "./admin.interface";

const spotlightPriceSchema = new Schema<ISpotlightPrice>({
    price: { type: Number, required: true },
    status: { type: String, enum: ['active', 'inactive'], required: true },
});
export const SpotlightPrice = model<ISpotlightPrice, ISpotlightModel>('SpotlightPrice', spotlightPriceSchema);

const companyInfoSchema = new Schema<ICompanyInfo, CompanyInfoModel>({
    company_name: { type: String, required: true },
    company_address: { type: String, required: true },
    job_url: { type: String, required: true },
    company_logo: { type: String, required: false },
    contact_email: { type: String, required: false },
});
export const CompanyInfo = model<ICompanyInfo, CompanyInfoModel>('CompanyInfo', companyInfoSchema);