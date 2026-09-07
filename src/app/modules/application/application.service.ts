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
import { application, query } from 'express';
import { StatusCodes } from 'http-status-codes';
import { generateZoomLink } from '../../../helpers/zoomHelper';
import { Chat } from '../chat/chat.model';
import { ChatService } from '../chat/chat.service';
import { emailHelper } from '../../../helpers/emailHelper';
import { sendNotifications } from '../../../helpers/notificationsHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import { subscriptionHelper } from '../subscription/subscription.helper';
import { applicationExtractorPromptMaker } from './application.constants';

const createApplicationIntoDB = async (data: IApplication) => {
  console.log(data);
  const applicationk = await Application.create(data);

  const application = await Application.findById(applicationk._id).populate([
    'post',
    'user',
  ]);

  sendNotifications({
    title: `New application for ${((application as any).post as any)?.title} has been submitted!`,
    message: `${((application as any).user as any)?.name} has submitted an application for ${((application as any).post as any)?.title}`,
    isRead: false,
    filePath: 'application',
    receiver: [data.recruiter],
    referenceId: (application as any)._id,
  });
  sendNotifications({
    title: `Your application for ${((application as any).post as any)?.title} has been submitted!`,
    message: `Your application for ${((application as any).post as any)?.title} has been submitted!`,
    isRead: false,
    filePath: 'application',
    receiver: [data.user],
    referenceId: (application as any)._id,
  });
  await RedisHelper.keyDelete(`applications:${data.recruiter}:*`);
  return application;
};

const updateApplicationStatusToDB = async (
  id: string,
  status: APPLICATION_STATUS,
  body: IApplication,
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
      { new: true },
    );

    await RedisHelper.keyDelete(`applications:${application?.recruiter}:*`);

    const user = await User.findById(application?.user);
    const recruiter = await User.findById(application?.recruiter);
    const post = await Post.findById(application?.post);
    const data: INotification = {
      title: 'Application shortlisted',
      message: `Your application for ${post?.title} has been shortlisted by ${recruiter?.name}`,
      filePath: 'application',
      referenceId: id as any,
      isRead: false,
      receiver: [user?.id],
    };
    sendNotifications(data);
    const emailTemplatek = emailTemplate.shortlistedApplicationTemplate({
      userName: user?.name!,
      postTitle: post?.title!,
      email: user?.email!,
    });
    await emailHelper.sendEmail(emailTemplatek);

    return;
  }

  if (status == APPLICATION_STATUS.REJECTED) {
    await Application.findOneAndUpdate(
      { _id: id },
      {
        status: APPLICATION_STATUS.REJECTED,
        $push: {
          history: {
            title: 'Rejected',
            date: new Date(),
            description: 'Application has been rejected',
          },
        },
        rejectedReason: body.rejectedReason,
      },
      { new: true },
    );
    await RedisHelper.keyDelete(`applications:${application?.recruiter}:*`);
    const user = await User.findById(application?.user);
    const recruiter = await User.findById(application?.recruiter);
    const post = await Post.findById(application?.post);
    const datak: INotification = {
      title: 'Application rejected',
      message: `Your application for ${post?.title} has been rejected by ${recruiter?.name}`,
      filePath: 'application',
      referenceId: id as any,
      isRead: false,
      receiver: [user?.id],
    };
    sendNotifications(datak);
    const emailTemplatek = emailTemplate.jobApplicationRejectedTemplate({
      userName: user?.name!,
      postTitle: post?.title!,
      reason: body.rejectedReason,
      email: user?.email!,
    });
    await emailHelper.sendEmail(emailTemplatek);
    return;
  }

  if (status === APPLICATION_STATUS.INTERVIEW) {
    const data = await Application.findOneAndUpdate(
      { _id: id },
      {
        status: APPLICATION_STATUS.INTERVIEW,
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
      { new: true },
    );
    await RedisHelper.keyDelete(`applications:${application?.recruiter}:*`);
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
        data!?.interviewDetails!?.date,
      ).toLocaleDateString()} at ${body?.interviewDetails?.time}!`,
      isRead: false,
      receiver: [data?.user],
      filePath: 'application',
      referenceId: data?._id,
    } as INotification);
    const user = await User.findById(data?.user);
    const recruiter = await User.findById(data?.recruiter);
    const post = await Post.findById(data?.post);
    const datak: INotification = {
      title: 'Application sent for interview',
      message: `Your application for ${post?.title} has been sent for interview by ${recruiter?.name}`,
      filePath: 'application',
      referenceId: id as any,
      isRead: false,
      receiver: [user?.id],
    };
    sendNotifications(datak);
    const emailTemplatek = emailTemplate.interviewSelectedTemplate({
      userName: user?.name!,
      postTitle: post?.title!,
      email: user?.email!,
      interviewDate: new Date(
        data?.interviewDetails?.date!,
      ).toLocaleDateString(),
      interviewTime: data?.interviewDetails?.time!,
      interviewMode: data?.interviewDetails?.interview_type!,
    });
    await emailHelper.sendEmail(emailTemplatek);

    return;
  }

  await RedisHelper.keyDelete(`applications:${application?.recruiter}:*`);

  return true;
};

const getAllApplications = async (
  query: Record<string, any>,
  user: JwtPayload,
) => {
  const cache = await RedisHelper.redisGet(`applications:${user.id}`, query);
  if (cache) {
    console.log('from cache');
    return cache;
  }

  console.log(query);

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
    data: applications.map(application => {
      if (query?.status !== 'INTERVIEW') {
        return application;
      }

      const interviewdate: any = new Date(application?.interviewDetails?.date!);
      const remainingDays = Math.floor(
        (interviewdate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      return {
        ...application.toJSON(),
        remainingDays,
      };
    }),
    pagination,
  };

  await RedisHelper.redisSet(`applications:${user.id}`, data, query);
  return data;
};

const deleteApplicationFromDB = async (
  id: Types.ObjectId,
  user: JwtPayload,
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
  body: Partial<IApplication>,
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
    { new: true },
  );
  await RedisHelper.keyDelete(`applications:${result?.recruiter}:*`);
  if (body.hiringStatus == 'hired') {
    const user = await User.findById(result?.user);
    const post = await Post.findById(result?.post).populate('recruiter');

    const template = emailTemplate.congratulationsHiredTemplate({
      userName: user?.name!,
      companyName: (post?.recruiter as any)?.name!,
      email: user?.email!,
      position: (post as any)?.title!,
    });

    await emailHelper.sendEmail(template);
  }

  if (body.hiringStatus == 'rejected') {
    const user = await User.findById(result?.user);
    const post = await Post.findById(result?.post).populate('recruiter');

    const template = emailTemplate.jobApplicationRejectedTemplate({
      userName: user?.name!,
      email: user?.email!,
      postTitle: (post as any)?.title!,
      reason: body.feedback,
    });

    await emailHelper.sendEmail(template);
  }

  return true;
};

const autoApplyForJobPosts = async (
  user: JwtPayload,
  cvPath: string,
  title: string,
  persentage: number,
  autoApplyId: string,
) => {
  try {
    // time delay
    // await new Promise((resolve) => setTimeout(resolve, 3000));
    const subscriptionBasedLimit = (await subscriptionHelper.isPremiumUser(
      user.id,
      'bronze',
    ))
      ? 10
      : (await subscriptionHelper.isPremiumUser(user.id, 'gold')) ||
          (await subscriptionHelper.isPremiumUser(user.id, 'silver'))
        ? 1000000
        : 0;
    const aiFile = await openAiFileUpload(cvPath);
    const prompt = applicationExtractorPromptMaker(cvPath);
    const cvInfo = await AIHelper.askAI(prompt, aiFile!);

    const skills = cvInfo?.skills;
    const designations = cvInfo?.designation;
    const applications = await Application.find({ user: user.id }).lean();
    const similerpost = (
      await Post.find({
        $or: [
          {
            title: { $regex: designations, $options: 'i' },
          },
          {
            required_skills: { $in: skills },
          },
        ],
        deadline: { $gte: new Date() },
        status: 'active',
        _id: { $nin: applications.map(app => app.post) },
        is_third_party_job:{ $ne:true }
      })
        .populate('recruiter', 'name')
        .limit(subscriptionBasedLimit)
        .lean()
        .exec()
    ).map(post => ({
      ...post,
      _id: post._id.toString(),
      recruiter: post?.recruiter?._id.toString(),
      companyName: (post.recruiter as any)?.name,
      category: post?.category?.toString(),
    }));
    const io = (global as any).io;

    if(similerpost.length === 0){
      io.emit(`auto-apply-progress::${autoApplyId}`, { completed: 0, total: 0, posts: [] });
      return true;
    }

    const postIds = await AIHelper.getJobMatchAutoApplyPersentances(
      user.id,
      persentage,
      aiFile!,
      similerpost as any,
    );
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
          posts: postIds.slice(0, 5),
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
      { new: true },
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

const getRecentApplications = async (
  query: Record<string, any>,
  user: JwtPayload,
) => {
  let initalQuery: Record<string, any> = {};
  if (user?.role === USER_ROLES.RECRUITER) {
    initalQuery = { recruiter: user.id };
  }

  if (query?.match) {
    const [a, b] = query.match.split('-').map(Number);
    initalQuery.jobMatch = { $gte: a || 0, $lte: b || 100 };
  }
  const data = new QueryBuilder(
    Application.find(initalQuery, {
      user: 1,
      jobMatch: 1,
      year_of_experience: 1,
      post: 1,
    }),
    query,
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
  query: Record<string, any>,
) => {
  const { id } = user;
  const applicationQuery = new QueryBuilder(
    Application.find({ user: id }),
    query,
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
        select:
          'title description thumbnail location job_type job_level min_salary max_salary required_skills deadline',
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
  if (!data) {
    throw new ApiError(404, 'Application not found');
  }
  if (data?.status !== APPLICATION_STATUS.INTERVIEW) {
    return data;
  }
  const remainingDays = Math.floor(
    (new Date(data?.interviewDetails?.date!).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24),
  );
  return {
    ...data,
    remainingDays,
  };
};

const startExtarnerNalInterviewOfApplication = async (
  applicationId: string,
) => {
  const application =
    await Application.findById(applicationId).populate('post');
  if (!application) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Application not found!');
  }
  const recruiter = await User.findById(application.recruiter);
  if (!recruiter) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Recruiter not found!');
  }
  const candidate = await User.findById(application.user);
  if (!candidate) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Candidate not found!');
  }

  const zoomURl = await generateZoomLink();
  const chat: any = await ChatService.createChatToDB([
    recruiter._id,
    candidate._id,
  ]);

  await kafkaProducer.sendMessage('chat', {
    type: 'create',
    data: {
      sender: recruiter._id,
      receiver: candidate._id,
      type: 'zoom-link',
      text: zoomURl,
      chatId: chat._id,
      isCustom: true,
    },
  });

  const template = emailTemplate.zoomMeetingInviteTemplate({
    userName: candidate?.name!,
    email: candidate?.email!,
    meetingDate: new Date(application?.interviewDetails?.date!).toDateString(),
    meetingTime: application?.interviewDetails?.time!,
    meetingLink: zoomURl,
    meetingTitle: `${(application?.post as any)?.title}'s Interview`,
  });

  emailHelper.sendEmail(template);

  return zoomURl;
};

const changeIterviewDetailsOfApplication = async (
  applicationId: string,
  data: IApplication['interviewDetails'],
) => {
  console.log(data);

  const application =
    await Application.findById(applicationId).populate('post');
  if (!application) {
    return;
  }
  await Application.findByIdAndUpdate(
    applicationId,
    { interviewDetails: data },
    { new: true },
  );
  await RedisHelper.keyDelete(`applications:${application.recruiter}:*`);
  await RedisHelper.keyDelete(`applications:${application.user}:*`);
  const candidate = await User.findById(application.user);
  await sendNotifications({
    title: 'Interview Details Updated',
    message: `Interview details of ${(application.post as any)?.title} has been updated. No your interview will be on ${new Date(data?.date!).toLocaleString()}`,
    filePath: 'application',
    referenceId: applicationId as any,
    isRead: false,
    receiver: [application.user],
  });
  // await emailHelper.sendEmail({
  //   to: candidate?.email!,
  //   subject: `Interview Details Updated for ${(application.post as any)?.title}`,
  //   html:`Your interview details of ${(application.post as any)?.title} has been updated. No your interview will be on ${new Date(data?.date!).toLocaleString()} ${data?.time}.<br><br>Best regards,<br>${candidate?.name}`,
  // })

  return;
};

const cancelInterviewOfApplication = async (
  applicationId: string,
  reson: string,
) => {
  const application =
    await Application.findById(applicationId).populate('post');
  if (!application) {
    return;
  }
  await Application.findByIdAndUpdate(
    applicationId,
    { inteviewStatus: 'cancelled', interviewCancelledReason: reson },
    { new: true },
  );
  await RedisHelper.keyDelete(`applications:${application.recruiter}:*`);
  await RedisHelper.keyDelete(`applications:${application.user}:*`);
  const candidate = await User.findById(application.user);
  await sendNotifications({
    title: 'Interview Cancelled',
    message: `Interview of ${(application.post as any)?.title} has been cancelled.`,
    filePath: 'application',
    referenceId: applicationId as any,
    isRead: false,
    receiver: [application.user],
  });
  const template = emailTemplate.interviewCancelTemplate({
    userName: candidate?.name!,
    postTitle: (application.post as any)?.title,
    reseoon: reson,
    email: candidate?.email!,
  });
  await emailHelper.sendEmail(template);

  return;
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
  startExtarnerNalInterviewOfApplication,
  changeIterviewDetailsOfApplication,
  cancelInterviewOfApplication,
};
