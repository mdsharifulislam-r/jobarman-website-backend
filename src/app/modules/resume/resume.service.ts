import { JwtPayload } from 'jsonwebtoken';
import { IResume, ResumeModel } from './resume.interface';
import { Resume } from './resume.model';
import QueryBuilder from '../../builder/QueryBuilder';
const crateResumeIntoDB = async (data: IResume): Promise<IResume> => {
    const result = await Resume.create(data);
    return result;
}

const getAllResumeFromDB = async (query: Record<string, any>,user:JwtPayload)=> {
    const ResumeQuery = new QueryBuilder(Resume.find({user:user.id}), query).paginate().sort().filter()
    const [resumes,pagination] = await Promise.all([
      ResumeQuery.modelQuery.exec(),
      ResumeQuery.getPaginationInfo()
    ])
  
    return {
      data:resumes,
      pagination
    }
}

const updateResumeToDB = async (id: string, data: IResume) => {
    const result = await Resume.findOneAndUpdate({ _id: id }, data, {
      new: true,
    });
    return result;

}

const deleteResumeFromDB = async (id: string) => {
    const result = await Resume.findOneAndDelete({ _id: id });
    return result;
}
export const ResumeServices = {
    crateResumeIntoDB,
    getAllResumeFromDB,
    updateResumeToDB,
    deleteResumeFromDB
};
