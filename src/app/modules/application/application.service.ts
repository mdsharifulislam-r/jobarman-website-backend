import { JwtPayload } from 'jsonwebtoken';
import { APPLICATION_STATUS } from '../../../enums/application';
import ApiError from '../../../errors/ApiError';
import { ApplicationModel, IApplication } from './application.interface';
import { Application } from './application.model';
import { USER_ROLES } from '../../../enums/user';
import QueryBuilder from '../../builder/QueryBuilder';
import { populate } from 'dotenv';

const createApplicationIntoDB = async (data: IApplication) => {
    const application = await Application.create(data);
    return application;
};

const updateApplicationStatusToDB = async (id: string, status: APPLICATION_STATUS,body:IApplication) => {

    if(status === APPLICATION_STATUS.SHORTLISTED){
        await Application.findOneAndUpdate({ _id: id }, { status: APPLICATION_STATUS.INTERVIEW,$push:{history:{title:'Shortlisted',date:new Date(),description:'Application has been shortlisted'}} }, { new: true });
    }

    if(status == APPLICATION_STATUS.REJECTED){
        if(!body.rejectedReason){
            throw new ApiError(400, 'Rejected reason is required');
        }
        await Application.findOneAndUpdate({ _id: id }, { status: APPLICATION_STATUS.INTERVIEW,$push:{history:{title:'Rejected',date:new Date(),description:'Application has been rejected'}},rejectedReason:body.rejectedReason }, { new: true });
    }

    if(status === APPLICATION_STATUS.INTERVIEW){
        if(!body.interviewDetails){
            throw new ApiError(400, 'Interview details are required');
        }
        await Application.findOneAndUpdate({ _id: id }, { status: status,$push:{history:{title:'Interview',date:new Date(),description:'Application has been sent for interview'}},interviewDetails:body.interviewDetails }, { new: true });
    }


    return true;

}

const getAllApplications = async (query: Record<string, any>,user:JwtPayload) => {
    const [min,max] = query.match ?query.match?.split('-')?.map((item:any)=>Number(item)):[]
    const initalQuery = [USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN].includes(user.role) ? {} : user.role === USER_ROLES.RECRUITER ? {recruiter:user.id,...(min || max ? {jobMatch:{$gte:min||0,$lte:max||1000}}:{})} : {user:user.id}
    const applicationQuery = new QueryBuilder(Application.find(initalQuery), query).paginate().sort().filter(['match']).search(['title'])
    const [applications,pagination] = await Promise.all([
      applicationQuery.modelQuery.populate([
        {
            path:'post',
            select:'title description thumbnail location '
        },
        {
            path:'recruiter',
            select:'name email image'
        },
        {
            path:'user',
            select:'name email image bio'
        }
      ]),
      applicationQuery.getPaginationInfo()
    ])
  
    return {
      data:applications,
      pagination
    }
};



export const ApplicationServices = {
    createApplicationIntoDB,
    updateApplicationStatusToDB,
    getAllApplications
};
