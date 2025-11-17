import ApiError from "../../../errors/ApiError";
import unlinkFile from "../../../shared/unlinkFile";
import QueryBuilder from "../../builder/QueryBuilder";
import { ISupport } from "./support.interface";
import { Support } from "./support.model";

const createSupportIntoDB = async (body: ISupport) => { 
   return await Support.create(body);
};

const getAllSupport = async (query: Record<string, any>) => { 
   const supportQuery = new QueryBuilder(Support.find(), query).paginate().sort().filter().search(['reason','description','supportId'])

   const [supports,pagination] = await Promise.all([
     supportQuery.modelQuery?.populate('user','name email image').exec(),
     supportQuery.getPaginationInfo()
   ])

   return {
     data:supports,
     pagination
   }
};

const deleteSupportFromDB = async (id: string) => { 
    const exist = await Support.findById(id);
    if (!exist) {
        throw new ApiError(404,'Support not found');
    }
    if(exist.images?.length){
        exist.images.forEach(image => {
            unlinkFile(image);
        });
    }
    if(exist.docs?.length){
        exist.docs.forEach(doc => {
            unlinkFile(doc);
        });
    }
   return await Support.findByIdAndDelete(id);
};

export const SupportServices = {
  createSupportIntoDB,
  getAllSupport,
  deleteSupportFromDB
};
