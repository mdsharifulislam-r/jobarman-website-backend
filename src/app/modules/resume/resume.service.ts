import { JwtPayload } from 'jsonwebtoken';
import { IResume, ResumeModel } from './resume.interface';
import { Resume } from './resume.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
const crateResumeIntoDB = async (data: IResume): Promise<IResume> => {
  console.log(data.workExperiences);
  
    const result = await Resume.create(data);
    kafkaProducer.sendMessage("resume", {type:"extract_resume_data",data:result});
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

const getResumeByIdFromDB = async (id: string) => {
    const result = await Resume.findById(id);
    return result;
}


const createResumeIntoExternalPdf = async (data: IResume) => {
  data.is_external_resume = true
  const createResume = await Resume.create(data);
  kafkaProducer.sendMessage("resume", {type:"extract_resume_data",data:createResume});
  return createResume
}

const updateResumeExternalPdf = async (id: string, data: IResume) => {
  const result = await Resume.findOneAndUpdate({ _id: id }, data, {
    new: true,
  });
  await kafkaProducer.sendMessage("resume", {type:"extract_resume_data",data:result});
  return result;
}
export const ResumeServices = {
    crateResumeIntoDB,
    getAllResumeFromDB,
    updateResumeToDB,
    deleteResumeFromDB,
    getResumeByIdFromDB,
    createResumeIntoExternalPdf,
    updateResumeExternalPdf
};
