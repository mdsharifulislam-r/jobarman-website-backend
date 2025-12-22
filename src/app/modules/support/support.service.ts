import ApiError from '../../../errors/ApiError';
import { emailHelper } from '../../../helpers/emailHelper';
import unlinkFile from '../../../shared/unlinkFile';
import AggregateQueryBuilder from '../../builder/AggrigateQueryBuilder';
import QueryBuilder from '../../builder/QueryBuilder';
import { IUser } from '../user/user.interface';
import { ISupport } from './support.interface';
import { Support } from './support.model';

const createSupportIntoDB = async (body: ISupport) => {
  return await Support.create(body);
};

const getAllSupport = async (query: Record<string, any>) => {
  const supportQuery = new AggregateQueryBuilder(Support, query);
  supportQuery.addCustomStage({
    $lookup: {
      from: 'users',
      localField: 'user',
      foreignField: '_id',
      as: 'user',
      pipeline: [
        { $project: { name: 1, email: 1, image: 1, address: 1, phone: 1 } },
      ],
    },
  });

  supportQuery.addCustomStage({
    $unwind: { path: '$user', preserveNullAndEmptyArrays: true },
  });
  supportQuery.search(['user.name', 'user.email']);
  supportQuery.filter(['downloadType']);
  supportQuery.sort()
  supportQuery.paginate();

  const [supports, pagination] = await Promise.all([
    supportQuery.exec(),
    supportQuery.getPaginationInfo(),
  ]);

  return {
    data: supports,
    pagination,
  };
};

const deleteSupportFromDB = async (id: string) => {
  const exist = await Support.findById(id);
  if (!exist) {
    throw new ApiError(404, 'Support not found');
  }
  if (exist.images?.length) {
    exist.images.forEach(image => {
      unlinkFile(image);
    });
  }
  if (exist.docs?.length) {
    exist.docs.forEach(doc => {
      unlinkFile(doc);
    });
  }
  return await Support.findByIdAndDelete(id);
};

const replySupport = async (id: string, body: Partial<ISupport>) => {
  const exist = await Support.findById(id).populate('user', 'name email image');
  if (!exist) {
    throw new ApiError(404, 'Support not found');
  }

  const user = exist.user as any as IUser;

  emailHelper.sendEmail({
    to: user.email,
    subject: 'Reply Support',
    html: body.reply!,
  });
  return await Support.findOneAndUpdate(
    { _id: id },
    { reply: body.reply, status: 'resolved' },
    { new: true }
  );
};

export const SupportServices = {
  createSupportIntoDB,
  getAllSupport,
  deleteSupportFromDB,
  replySupport,
};
