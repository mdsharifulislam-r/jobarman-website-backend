import { StatusCodes } from 'http-status-codes';

import { IUser } from '../user/user.interface';
import { User } from '../user/user.model';
import ApiError from '../../../errors/ApiError';
import QueryBuilder from '../../builder/QueryBuilder';
import { emailTemplate } from '../../../shared/emailTemplate';
import { emailHelper } from '../../../helpers/emailHelper';
import { CompanyInfo, SpotlightPrice } from './admin.model';
import { ICompanyInfo } from './admin.interface';

const createAdminToDB = async (payload: IUser): Promise<IUser> => {
    const createAdmin= await User.create({
        ...payload,
        role: 'ADMIN',
        verified: true,
    });
    if (!createAdmin) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create Admin');
    }


    return createAdmin;
};

const deleteAdminFromDB = async (id: any): Promise<IUser | undefined> => {
    const isExistAdmin = await User.findOneAndDelete({ _id: id, role: 'ADMIN' });
    if (!isExistAdmin) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete Admin');
    }
    return;
};

const getAdminFromDB = async (query:Record<string,any>)=> {
    const result = new QueryBuilder(User.find({verified:true,status:'active',role:'ADMIN'}),query).paginate().sort()
    const paginationInfo = await result.getPaginationInfo()
    const resultData = await result.modelQuery.lean()
    return {
        paginationInfo,
        resultData
    }
};

const updateAdminInfo = async (id: any, payload: any) => {
    const isExistAdmin = await User.findOneAndUpdate({ _id: id, role: 'ADMIN' }, payload, { new: true });
    if (!isExistAdmin) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update Admin');
    }
    return isExistAdmin;
}

const createPriceForSpotlight = async (price:number) => {
    const newPrice = await SpotlightPrice.create({price,status:'active'});
    await SpotlightPrice.updateMany({_id:{$ne:newPrice._id}},{status:'inactive'});
    return newPrice;
}

const currentPriceForSpotlight = async () => {
    const price = await SpotlightPrice.findOne({status:'active'}).lean();
    return price;
}

const getCompanyInfoForExpiredJobs = async (query:Record<string,any>)=> {
    const companyQuery = new QueryBuilder(CompanyInfo.find({}),query).sort().paginate().search(['company_name','contact_email']);
    const [companies,pagination] = await Promise.all([
        companyQuery.modelQuery.lean(),
        companyQuery.getPaginationInfo()
    ])
    return {
        pagination,
        companies
    }
}


export const AdminService = {
    createAdminToDB,
    deleteAdminFromDB,
    getAdminFromDB,
    updateAdminInfo,
    createPriceForSpotlight,
    currentPriceForSpotlight,
    getCompanyInfoForExpiredJobs
};
