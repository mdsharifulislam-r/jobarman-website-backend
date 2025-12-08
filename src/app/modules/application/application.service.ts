import { JwtPayload } from 'jsonwebtoken';
import { APPLICATION_STATUS } from '../../../enums/application';
import ApiError from '../../../errors/ApiError';
import { ApplicationModel, IApplication } from './application.interface';
import { Application, AutoApply, Interview } from './application.model';
import { USER_ROLES } from '../../../enums/user';
import QueryBuilder from '../../builder/QueryBuilder';
import { populate } from 'dotenv';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { INotification } from '../notification/notification.interface';
import { Types } from 'mongoose';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import { User } from '../user/user.model';
import { Post } from '../post/post.model';
import { openAiFileUpload } from '../../../helpers/openAiHelper';
import { AIHelper } from '../../../helpers/aiHelper';
import { query } from 'express';

const createApplicationIntoDB = async (data: IApplication) => {
  const application = await Application.create(data);
  await RedisHelper.keyDelete(`applications:${data.recruiter}:*`);
  return application;
};

const updateApplicationStatusToDB = async (
  id: string,
  status: APPLICATION_STATUS,
  body: IApplication
) => {
  const application = await Application.findById(id);
  if (status === APPLICATION_STATUS.SHORTLISTED) {
    await Application.findOneAndUpdate(
      { _id: id },
      {
        status: APPLICATION_STATUS.SHORTLISTED,
        $push: {
          history: {
            title: 'Shortlisted',
            date: new Date(),
            description: 'Application has been shortlisted',
          },
        },
      },
      { new: true }
    );
  }

  if (status == APPLICATION_STATUS.REJECTED) {
    await Application.findOneAndUpdate(
      { _id: id },
      {
        status: APPLICATION_STATUS.INTERVIEW,
        $push: {
          history: {
            title: 'Rejected',
            date: new Date(),
            description: 'Application has been rejected',
          },
        },
        rejectedReason: body.rejectedReason,
      },
      { new: true }
    );
  }

  if (status === APPLICATION_STATUS.INTERVIEW) {
    const data = await Application.findOneAndUpdate(
      { _id: id },
      {
        status: status,
        $push: {
          history: {
            title: 'Interview',
            date: new Date(),
            description: 'Application has been sent for interview',
          },
        },
        interviewDetails: body.interviewDetails,
        isInterviewCompleted: false,
      },
      { new: true }
    );
    // await Interview.create({
    //     application:data?._id,
    //     date:body?.interviewDetails?.date,
    //     time:body?.interviewDetails?.time,
    //     interview_type:body?.interviewDetails?.interview_type,
    //     candidate:data?.user,
    //     recruiter:data?.recruiter,
    //     post:data?.post
    // })
    await kafkaProducer.sendMessage('notification', {
      title: `Your application for ${data?.title} has been sent for interview!`,
      message: `Your application for ${
        data?.title
      } has been sent for interview on ${new Date(
        data!?.interviewDetails!?.date
      ).toLocaleDateString()} at ${body?.interviewDetails?.time}!`,
      isRead: false,
      receiver: [data?.user],
      filePath: 'application',
      referenceId: data?._id,
    } as INotification);
  }

  await RedisHelper.keyDelete(`applications:${application?.recruiter}:*`);

  return true;
};

const getAllApplications = async (
  query: Record<string, any>,
  user: JwtPayload
) => {
  const cache = await RedisHelper.redisGet(`applications:${user.id}`, query);
  if (cache) {
    console.log('from cache');
    return cache;
  }
  let filter: Record<string, any> = {};

  // -----------------------
  // 1. INTERVIEW RANGE
  // -----------------------
  let min: number | null = null;
  let max: number | null = null;

  if (query.match) {
    const [a, b] = query.match.split('-').map(Number);
    min = a || 0;
    max = b || 100;
  }

  // -----------------------
  // 2. INTERVIEW TYPE (complete / not)
  // -----------------------
  const interviewType = query.interview_type === 'complete';

  // -----------------------
  // 3. INTERVIEW DATE RANGE
  // -----------------------
  let interviewDateFilter: any = null;

  if (query.interview_date) {
    const date = new Date(query.interview_date);
    const start = new Date(date.setHours(0, 0, 0, 0));
    const end = new Date(date.setHours(23, 59, 59, 999));

    interviewDateFilter = {
      'interviewDetails.date': {
        $gte: start,
        $lte: end,
      },
    };
  }

  if ([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(user.role)) {
    // Admin sees everything → no extra filter
    filter = {};
  } else if (user.role === USER_ROLES.RECRUITER) {
    filter = {
      recruiter: user.id,
      reqruiter_deleted: { $ne: true },
      ...(query.interview_type ? { isInterviewCompleted: interviewType } : {}),
    };

    console.log(filter);

    if (min !== null && max !== null) {
      filter.jobMatch = { $gte: min, $lte: max };
    }

    if (interviewDateFilter) {
      Object.assign(filter, interviewDateFilter);
    }
  } else {
    // Normal User
    filter = {
      user: user.id,
      user_deleted: { $ne: true },
    };
  }

  const applicationQuery = new QueryBuilder(Application.find(filter), query)
    .paginate()
    .sort()
    .filter(['match', 'interview_type', 'interview_date'])
    .search(['title']);

  const [applications, pagination] = await Promise.all([
    applicationQuery.modelQuery.populate([
      {
        path: 'post',
        select: 'title description thumbnail location ',
      },
      {
        path: 'recruiter',
        select: 'name email image',
      },
      {
        path: 'user',
        select: 'name email image bio',
      },
    ]),
    applicationQuery.getPaginationInfo(),
  ]);

  const data = {
    data: applications,
    pagination,
  };

  await RedisHelper.redisSet(`applications:${user.id}`, data, query);
  return data;
};

const deleteApplicationFromDB = async (
  id: Types.ObjectId,
  user: JwtPayload
) => {
  console.log(id, user);
  const data =
    user.role == 'RECRUITER'
      ? { reqruiter_deleted: true }
      : { user_deleted: true };
  console.log(data);

  const result = await Application.findByIdAndUpdate(id, data, { new: true });
  await RedisHelper.keyDelete(`applications:${user.id}:*`);
  return result;
};

const feedBackOfInterview = async (
  id: Types.ObjectId,
  body: Partial<IApplication>
) => {
  const result = await Application.findByIdAndUpdate(
    id,
    {
      ...body,
      isInterviewCompleted: true,
      $push: {
        history: {
          title: 'Status',
          date: new Date(),
          description: body.inteviewStatus,
        },
      },
    },
    { new: true }
  );
  await RedisHelper.keyDelete(`applications:${result?.recruiter}:*`);
  return true;
};

const autoApplyForJobPosts = async (
  user: JwtPayload,
  cvPath: string,
  title: string,
  persentage: number,
  autoApplyId: string
) => {
  try {
    console.log(cvPath);

    const aiFile = await openAiFileUpload(cvPath);
    const userProfile = await User.findById(user.id);
    const skills = userProfile?.skills || [];
    const applications = await Application.find({ user: user.id }).lean();
    const similerpost = (
      await Post.find({
        // title:{ $regex: new RegExp(title, 'i') },
        // required_skills: { $in: skills },
        deadline: { $gte: new Date() },
        status: 'active',
        // _id: { $nin: applications.map(app => app.post) }
      })
        .lean()
        .exec()
    ).map(post => ({
      ...post,
      _id: post._id.toString(),
      recruiter: post.recruiter.toString(),
      category: post.category.toString(),
    }));

    const postIds = await AIHelper.getJobMatchAutoApplyPersentances(
      user.id,
      persentage,
      aiFile!,
      similerpost as any
    );
    const io = (global as any).io;
    let completedCount = 0;

    for (const postId of postIds) {
      try {
        await Application.create({
          user: user.id,
          post: (postId as any)._id,
          recruiter: postId.recruiter,
          title: postId.title,
          jobMatch: (postId as any)?.jobMatch,
          isAutoApplied: true,
          autoApplyId: new Types.ObjectId(autoApplyId),
          year_of_experience: '2 years',
          resume: cvPath,
        });
        completedCount++;
        io.emit(`auto-apply-progress::${autoApplyId}`, {
          completed: completedCount,
          total: postIds.length,
          posts: postIds
            ?.filter((v: any) => v._id !== (postId as any)._id)
            .slice(0, 5),
        });
      } catch (error) {
        console.log(`error in ${(postId as any)._id}`);
        console.log(error);

        continue;
      }
    }
    await AutoApply.findByIdAndUpdate(
      autoApplyId,
      {
        totalApplied: postIds.length,
        successfulApplied: completedCount,
        posts: postIds.map((post: any) => post._id),
      },
      { new: true }
    );
    return true;
  } catch (error) {
    console.log(error);
  }
};

const getAutoApplyResults = async (id: string) => {
  const data = await AutoApply.findById(id).populate('posts').lean();
  return data;
};

const getRecentApplications = async (query: Record<string, any>) => {
  const data = new QueryBuilder(
    Application.find({}, { user: 1, jobMatch: 1, year_of_experience: 1 }),
    query
  )
    .sort()
    .paginate();
  const [applications, pagination] = await Promise.all([
    data.modelQuery.populate('user', 'name email image bio designation').exec(),
    data.getPaginationInfo(),
  ]);

  return {
    data: applications,
    pagination,
  };
};

const getUserApplications = async (
  user: JwtPayload,
  query: Record<string, any>
) => {
  const { id } = user;
  const applicationQuery = new QueryBuilder(
    Application.find({ user: id }),
    query
  )
    .paginate()
    .sort()
    .filter();
  const [applications, pagination] = await Promise.all([
    applicationQuery.modelQuery
      .populate('post', 'thumbnail address title recruiter')
      .exec(),
    applicationQuery.getPaginationInfo(),
  ]);
  return {
    data: applications,
    pagination,
  };
};

const singleApplicationDetails = async (id: string) => {
  const data = await Application.findById(id)
    .populate([
      {
        path: 'post',
        select: 'title description thumbnail location',
      },
      {
        path: 'recruiter',
        select: 'name email image',
      },
      {
        path: 'user',
        select: 'name email image bio',
      },
    ])
    .lean();
  return data;
};

export const ApplicationServices = {
  createApplicationIntoDB,
  updateApplicationStatusToDB,
  getAllApplications,
  deleteApplicationFromDB,
  feedBackOfInterview,
  autoApplyForJobPosts,
  getAutoApplyResults,
  getRecentApplications,
  getUserApplications,
  singleApplicationDetails,
};
