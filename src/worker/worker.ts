// import cron from 'node-cron';
// import { IUser } from '../app/modules/user/user.interface';
// import { Application } from '../app/modules/application/application.model';
// import { Post } from '../app/modules/post/post.model';
// import { AIHelper } from '../helpers/aiHelper';
// import { User } from '../app/modules/user/user.model';
// import { USER_ROLES } from '../enums/user';
// import { kafkaProducer } from '../tools/kafka/kafka-producers/kafka.producer';
// import { ICompanyInfo } from '../app/modules/admin/admin.interface';
// import { CompanyInfo } from '../app/modules/admin/admin.model';
// import { Subscription } from '../app/modules/subscription/subscription.model';
// import { sendNotifications } from '../helpers/notificationsHelper';
// import { subscriptionHelper } from '../app/modules/subscription/subscription.helper';
// import { Category } from '../app/modules/category/category.model';
// import { Jobs } from 'openai/resources/fine-tuning/jobs/jobs';
// import { jobspikrHelper } from '../helpers/jobspkrHelper';
// import { highDemandJobs } from '../data/jobs';
// import { emailHelper } from '../helpers/emailHelper';
// import { Favourite } from '../app/modules/favourite/favourite.model';
// export const startWorker = () => {
//   // 6 times in a day (every 4 hours)
//   // cron.schedule('0 */4 * * *', async () => {
//   //   // await AutoApply();
//   //   await getUserInfoAndSendEmailToThem();
//   //   // await deleteExpireJobsPosts();
//   //   // await suspendExpiredSubscriptions();
//   //   // await fetchNewData();

//   //   console.log('Cron Job Runned');
//   // });
//   // };

//   cron.schedule('0 0 * * *', async () => {
//     AutoApply();
//     await sendEmailBatchToUsers();
//     deleteExpireJobsPosts();
//     suspendExpiredSubscriptions();
// fetchNewData10TimesInDay()

//     // await fetchNewData();
    
//     console.log('Cron Job Runned');
//   });

// };


// const getUserInfoAndSendEmailToThem = async (
//   startIndex: number,
//   endIndex: number,
// ) => {
//   // only for those user those are get job update more than 1 day ago
//   try {
//     const users = await User.find(
//       { role: USER_ROLES.EMPLOYEE, verified: true, status: 'active' },
//       { designation: 1, educations: 1, workExperiences: 1, skills: 1 },
//     )
//       .sort({ createdAt: -1 })
//       .skip(startIndex)
//       .limit(endIndex)
//       .lean();
//     if (users.length === 0) {
//       return;
//     }
//     const getAiSuggestion =
//       await AIHelper.analizeUserInfoAndGenerateMetaInformation(users as any);

//     for (const userInfo of getAiSuggestion) {
//       await kafkaProducer.sendMessage('post', {
//         type: 'send-job-match-email',
//         data: userInfo,
//       });
//     }
//   } catch (error) {
//     console.log(error);
//     await emailHelper.sendDevEmail(error);
//   }
// };

// async function sendEmailBatchToUsers() {
//   try {
//     const totalUsers = await User.countDocuments({
//       role: USER_ROLES.EMPLOYEE,
//       verified: true,
//       status: 'active',
//     });
//     const totalBatches = Math.ceil(totalUsers / 40);

//     for (let i = 0; i < totalBatches; i++) {
//       const startIndex = i * 40;
//       const endIndex = startIndex + 40;
//       getUserInfoAndSendEmailToThem(startIndex, endIndex);
//       console.log(`Batch ${i + 1} sent startIndex: ${startIndex} endIndex: ${endIndex}`);
//     }
//   } catch (error) {
//     console.log(error);
//     await emailHelper.sendDevEmail(error);
//   }
// }

// async function AutoApply() {
//   const users = await User.find({
//     role: USER_ROLES.EMPLOYEE,
//     verified: true,
//     status: 'active',
//     isAutoApply: true,
//   }).lean();
//   await Promise.all(users.map(user => matchAndApplyPost(user as any)));
// }

// export const matchAndApplyPost = async (user: IUser & { _id: string }) => {
//   try {
//     const applications = await Application.find(
//       { user: user._id },
//       { _id: 1, post: 1 },
//     ).lean();

//     const subscriptionBasedLimit = (await subscriptionHelper.isPremiumUser(
//       user._id,
//       'bronze',
//     ))
//       ? 10
//       : (await subscriptionHelper.isPremiumUser(user._id, 'gold')) ||
//           (await subscriptionHelper.isPremiumUser(user._id, 'silver'))
//         ? 1000000
//         : 0;

//     const postIds = applications.map(app => app.post);
//     let post = await Post.find({
//       _id: { $nin: postIds },
//       deadline: { $gte: new Date() },
//       status: 'active',
//       is_third_party_job: { $ne: true },
//     }).lean();
//     post = post.map(post => ({
//       ...post,
//       _id: post._id.toString(),
//       recruiter: post?.recruiter?.toString(),
//       category: post?.category?.toString(),
//     })) as any;
//     const aiSuggesstionPost = await AIHelper.getJobMatchAutoApplyPersentances(
//       user._id,
//       20,
//       '',
//       post as any,
//     );
//     await Promise.all(
//       aiSuggesstionPost
//         ?.slice(0, subscriptionBasedLimit)
//         ?.map(async (postId: any) => {
//           await Application.create({
//             user: user._id,
//             post: postId._id,
//             recruiter: postId.recruiter,
//             title: postId.title,
//             jobMatch: postId.jobMatch,
//             isAutoApplied: true,
//             resume: user.resume,
//             year_of_experience: `2`,
//           });
//         }),
//     );

//     console.log(`Auto Applyed ${aiSuggesstionPost.length} post`);
//   } catch (error) {
//     console.log(error);
//     await emailHelper.sendDevEmail(error);
//   }
// };

// const deleteExpireJobsPosts = async () => {
//   //post date less than 30 days or deadline passed
//   try {
//     const expireJobs = await Post.find({
//       $or: [
//         { deadline: { $lt: new Date() } },
//         {
//           post_date: {
//             $lt: new Date(new Date().setDate(new Date().getDate() - 30)),
//           },
//         },
//       ],
//       is_third_party_job: true,
//     }).lean();
//     const arr: ICompanyInfo[] = [];
//     await Promise.all(
//       expireJobs.map(async job => {
//         if (true) {
//           const isExist = await CompanyInfo.findOne({
//             company_name: job.recruiter_company,
//             contact_email: job.company_contact_email,
//           });
//           if (isExist) {
//             return;
//           }
//           arr.push({
//             contact_email: job.company_contact_email! || '',
//             company_name: job.recruiter_company || '',
//             job_url: job.job_url || '',
//             company_logo: job.thumbnail || '',
//             company_address: job.location || '',
//           });
//         }

//         await Favourite.deleteMany({ post: job._id });

//         await Post.deleteOne({ _id: job._id });
//       }),
//     );

//     if (arr.length > 0) {
//       await CompanyInfo.insertMany(arr);
//     }
//     console.log(`Deleted ${expireJobs.length} expired jobs`);
//   } catch (error) {
//     console.log(error);
//     await emailHelper.sendDevEmail(error);
//   }
// };

// const suspendExpiredSubscriptions = async () => {
//   try {
//     const subscriptions = await Subscription.find({
//       status: 'active',
//       endDate: { $lt: new Date() },
//     }).lean();
//     await Promise.all(
//       subscriptions.map(async subscription => {
//         await Subscription.updateOne(
//           { _id: subscription._id },
//           { status: 'expired' },
//         );
//         await User.updateOne(
//           { _id: subscription.user },
//           { $pull: { subscription: subscription._id } },
//         );
//         await sendNotifications({
//           title: `Your subscription has been expired!`,
//           message: `Please renew your subscription to continue using our platform.`,
//           receiver: [subscription.user],
//           isRead: false,
//           filePath: 'subscription',
//           referenceId: subscription._id,
//         });
//       }),
//     );
//     console.log(`Suspended ${subscriptions.length} expired subscriptions`);
//   } catch (error) {
//     console.log(error);
//     await emailHelper.sendDevEmail(error);
//   }
// };

// const fetchNewData10TimesInDay = async () => {
//   try {
//     let cursor = 0;

//     for (let i = 0; i < 10; i++) {
//       const getThirdPartyJobs = await jobspikrHelper.getJobs({
//         jobtitles: highDemandJobs,
//         limit: 100,
//         ...(cursor ? { cursor } : {}),
//       });

//       cursor = getThirdPartyJobs.next_cursor!;

//       const filteredJobs = await Promise.all(
//         getThirdPartyJobs.data.map(async (job: any) => {
//           const exists = await Post.exists({
//             unique_id: job.unique_id,
//           });

//           return exists ? null : job;
//         }),
//       );

//       const data = filteredJobs.filter(Boolean);

//       if (data.length) {
//         await Post.insertMany(data);
//       }

//       console.log(`Fetched ${data.length} new jobs`);
//     }
//   } catch (error) {
//     console.log(error);
//     await emailHelper.sendDevEmail(error);
//   }
// };

// const fetchNewData = async (cursor?: number) => {
//   try {
//     const getThirdPartyJobs = await jobspikrHelper.getJobs({
//       jobtitles: highDemandJobs,
//       limit: 100,
//       ...(cursor ? { cursor } : {}),
//     });

//     const data = await Promise.all(
//       getThirdPartyJobs?.data?.filter(async (job: any) => {
//         return !(await Post.exists({ unique_id: job.unique_id }));
//       }),
//     );

//     await Post.insertMany(data);

//     console.log(`Fetched ${getThirdPartyJobs.data?.length} new jobs`);
//   } catch (error) {
//     console.log(error);
//     await emailHelper.sendDevEmail(error);
//   }
// };




import cron from 'node-cron';

import { IUser } from '../app/modules/user/user.interface';
import { Application } from '../app/modules/application/application.model';
import { Post } from '../app/modules/post/post.model';
import { AIHelper } from '../helpers/aiHelper';
import { User } from '../app/modules/user/user.model';
import { USER_ROLES } from '../enums/user';
import { kafkaProducer } from '../tools/kafka/kafka-producers/kafka.producer';
import { ICompanyInfo } from '../app/modules/admin/admin.interface';
import { CompanyInfo } from '../app/modules/admin/admin.model';
import { Subscription } from '../app/modules/subscription/subscription.model';
import { sendNotifications } from '../helpers/notificationsHelper';
import { subscriptionHelper } from '../app/modules/subscription/subscription.helper';
import { jobspikrHelper } from '../helpers/jobspkrHelper';
import { highDemandJobs } from '../data/jobs';
import { emailHelper } from '../helpers/emailHelper';
import { Favourite } from '../app/modules/favourite/favourite.model';

const USER_BATCH_SIZE = 40;
const AUTO_APPLY_CONCURRENCY = 5;
const JOB_FETCH_LIMIT = 100;
const JOB_FETCH_ITERATIONS = 10;

const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Start all scheduled workers
 */
export const startWorker = () => {
  console.log('Worker started');


  /**
   * Run once every day at midnight
   */
  cron.schedule('0 0 * * *', async () => {
    console.log('Daily worker started');

    try {
      await runDailyJobs();
    } catch (error) {
      await handleWorkerError(error, 'runDailyJobs');
    }
  });
  cron.schedule('0 */2 * * *', async () => {
    console.log('Third-party job fetch worker started');

    try {
      await fetchNewData10TimesInDay();
    } catch (error) {
      await handleWorkerError(error, 'fetchNewData10TimesInDay');
    }
  });
};

/**
 * Run daily jobs sequentially.
 *
 * Keeping these awaited prevents all heavy jobs
 * from hitting the database at the same time.
 */
const runDailyJobs = async () => {
  await AutoApply();

  await deleteExpireJobsPosts();

  await suspendExpiredSubscriptions();
      await sendEmailBatchToUsers();

  console.log('Daily jobs completed successfully');
};

/**
 * Common worker error handler
 */
const handleWorkerError = async (
  error: unknown,
  workerName: string,
) => {
  console.error(`[Worker Error] ${workerName}`, error);

  try {
    await emailHelper.sendDevEmail(error);
  } catch (emailError) {
    console.error(
      `[Worker Error] Failed to send developer email`,
      emailError,
    );
  }
};

/**
 * Get users in batches and send AI generated
 * job matching information to Kafka.
 */
const getUserInfoAndSendEmailToThem = async (
  startIndex: number,
  batchSize: number,
) => {
  try {
    const users = await User.find(
      {
        role: USER_ROLES.EMPLOYEE,
        verified: true,
        status: 'active',
      },
      {
        designation: 1,
        educations: 1,
        workExperiences: 1,
        skills: 1,
      },
    )
      .sort({ _id: 1 })
      .skip(startIndex)
      .limit(batchSize)
      .lean();

    if (!users.length) {
      return 0;
    }

    const aiSuggestions =
      await AIHelper.analizeUserInfoAndGenerateMetaInformation(
        users as any,
      );

    for (const userInfo of aiSuggestions) {
      await kafkaProducer.sendMessage('post', {
        type: 'send-job-match-email',
        data: userInfo,
      });
    }

    return users.length;
  } catch (error) {
    console.error('getUserInfoAndSendEmailToThem error:', error);

    await handleWorkerError(
      error,
      'getUserInfoAndSendEmailToThem',
    );

    return 0;
  }
};

/**
 * Send job matching emails in batches.
 */
const sendEmailBatchToUsers = async () => {
  try {
    const totalUsers = await User.countDocuments({
      role: USER_ROLES.EMPLOYEE,
      verified: true,
      status: 'active',
    });

    if (!totalUsers) {
      console.log('No eligible users found for email batch');

      return;
    }

    const totalBatches = Math.ceil(
      totalUsers / USER_BATCH_SIZE,
    );

    console.log(
      `Starting email processing: ${totalUsers} users, ${totalBatches} batches`,
    );

    for (let batch = 0; batch < totalBatches; batch++) {
      const startIndex = batch * USER_BATCH_SIZE;

      const processed = await getUserInfoAndSendEmailToThem(
        startIndex,
        USER_BATCH_SIZE,
      );

      console.log(
        `Email batch ${batch + 1}/${totalBatches} completed. Processed: ${processed}`,
      );
    }

    console.log('Email batch processing completed');
  } catch (error) {
    await handleWorkerError(error, 'sendEmailBatchToUsers');
  }
};

/**
 * Auto apply jobs for eligible users.
 */
const AutoApply = async () => {
  try {
    const users = await User.find({
      role: USER_ROLES.EMPLOYEE,
      verified: true,
      status: 'active',
      isAutoApply: true,
    }).lean();

    console.log(`Auto apply users found: ${users.length}`);

    /**
     * Process users in small chunks instead of
     * Promise.all on every user at once.
     */
    for (
      let i = 0;
      i < users.length;
      i += AUTO_APPLY_CONCURRENCY
    ) {
      const batch = users.slice(
        i,
        i + AUTO_APPLY_CONCURRENCY,
      );

      await Promise.all(
        batch.map(user =>
          matchAndApplyPost(user as any),
        ),
      );

      console.log(
        `Auto apply progress: ${Math.min(
          i + AUTO_APPLY_CONCURRENCY,
          users.length,
        )}/${users.length}`,
      );

      /**
       * Small delay prevents sudden database/AI spikes.
       */
      await sleep(100);
    }

    console.log('Auto apply completed');
  } catch (error) {
    await handleWorkerError(error, 'AutoApply');
  }
};

/**
 * Match jobs and automatically apply for a user.
 */
export const matchAndApplyPost = async (
  user: IUser & { _id: string },
) => {
  try {
    /**
     * Get already applied jobs.
     */
    const applications = await Application.find(
      {
        user: user._id,
      },
      {
        _id: 1,
        post: 1,
      },
    ).lean();

    /**
     * Determine subscription based limit.
     */
    let subscriptionBasedLimit = 0;

    const isBronze = await subscriptionHelper.isPremiumUser(
      user._id,
      'bronze',
    );

    if (isBronze) {
      subscriptionBasedLimit = 10;
    } else {
      const isGold =
        await subscriptionHelper.isPremiumUser(
          user._id,
          'gold',
        );

      const isSilver =
        await subscriptionHelper.isPremiumUser(
          user._id,
          'silver',
        );

      if (isGold || isSilver) {
        subscriptionBasedLimit = 1_000_000;
      }
    }

    if (subscriptionBasedLimit === 0) {
      return;
    }

    const postIds = applications.map(app =>
      app.post,
    );

    /**
     * Only fetch jobs that:
     *
     * - user has not already applied
     * - deadline has not passed
     * - are active
     * - are not third-party jobs
     */
    const posts = await Post.find({
      _id: {
        $nin: postIds,
      },
      deadline: {
        $gte: new Date(),
      },
      status: 'active',
      is_third_party_job: {
        $ne: true,
      },
    })
      .lean()
      .limit(500);

    if (!posts.length) {
      return;
    }

    const normalizedPosts = posts.map(post => ({
      ...post,
      _id: post._id.toString(),
      recruiter: post.recruiter?.toString(),
      category: post.category?.toString(),
    }));

    const aiSuggestions =
      await AIHelper.getJobMatchAutoApplyPersentances(
        user._id,
        20,
        '',
        normalizedPosts as any,
      );

    const selectedPosts = aiSuggestions?.slice(
      0,
      subscriptionBasedLimit,
    );

    if (!selectedPosts?.length) {
      return;
    }

    /**
     * Create applications.
     *
     * ordered:false prevents one duplicate document
     * from stopping the entire bulk operation.
     */
    const applicationsToCreate = selectedPosts.map(
      (post: any) => ({
        user: user._id,
        post: post._id,
        recruiter: post.recruiter,
        title: post.title,
        jobMatch: post.jobMatch,
        isAutoApplied: true,
        resume: user.resume,
        year_of_experience: '2',
      }),
    );

    await Application.insertMany(
      applicationsToCreate,
      {
        ordered: false,
      },
    );

    console.log(
      `Auto applied ${applicationsToCreate.length} jobs for user ${user._id}`,
    );
  } catch (error) {
    console.error(
      `matchAndApplyPost error for user ${user._id}:`,
      error,
    );

    await handleWorkerError(
      error,
      'matchAndApplyPost',
    );
  }
};

/**
 * Delete expired third-party jobs.
 */
const deleteExpireJobsPosts = async () => {
  try {
    const now = new Date();

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(
      thirtyDaysAgo.getDate() - 30,
    );

    const expiredJobs = await Post.find({
      is_third_party_job: true,
      $or: [
        {
          deadline: {
            $lt: now,
          },
        },
        {
          post_date: {
            $lt: thirtyDaysAgo,
          },
        },
      ],
    })
      .select(
        '_id recruiter_company company_contact_email job_url thumbnail location',
      )
      .lean();

    if (!expiredJobs.length) {
      console.log('No expired jobs found');

      return;
    }

    /**
     * Collect company information first.
     */
    const companyInfoMap = new Map<
      string,
      ICompanyInfo
    >();

    for (const job of expiredJobs) {
      if (
        !job.company_contact_email ||
        !job.recruiter_company
      ) {
        continue;
      }

      const key = `${job.recruiter_company}:${job.company_contact_email}`;

      if (!companyInfoMap.has(key)) {
        companyInfoMap.set(key, {
          contact_email:
            job.company_contact_email || '',
          company_name:
            job.recruiter_company || '',
          job_url: job.job_url || '',
          company_logo: job.thumbnail || '',
          company_address: job.location || '',
        });
      }
    }

    const companyInfo = Array.from(
      companyInfoMap.values(),
    );

    /**
     * Insert company information only if it
     * does not already exist.
     */
    for (const company of companyInfo) {
      if (
        !company.contact_email ||
        !company.company_name
      ) {
        continue;
      }

      await CompanyInfo.updateOne(
        {
          company_name: company.company_name,
          contact_email: company.contact_email,
        },
        {
          $setOnInsert: company,
        },
        {
          upsert: true,
        },
      );
    }

    const expiredJobIds = expiredJobs.map(
      job => job._id,
    );

    /**
     * Bulk delete related favourites.
     */
    await Favourite.deleteMany({
      post: {
        $in: expiredJobIds,
      },
    });

    /**
     * Bulk delete expired posts.
     */
    const deleteResult = await Post.deleteMany({
      _id: {
        $in: expiredJobIds,
      },
    });

    console.log(
      `Deleted ${deleteResult.deletedCount} expired jobs`,
    );
  } catch (error) {
    await handleWorkerError(
      error,
      'deleteExpireJobsPosts',
    );
  }
};

/**
 * Expire subscriptions whose end date has passed.
 */
const suspendExpiredSubscriptions = async () => {
  try {
    const now = new Date();

    const subscriptions =
      await Subscription.find({
        status: 'active',
        endDate: {
          $lt: now,
        },
      })
        .select('_id user')
        .lean();

    if (!subscriptions.length) {
      console.log(
        'No expired subscriptions found',
      );

      return;
    }

    for (const subscription of subscriptions) {
      /**
       * Update only if still active.
       *
       * This prevents unnecessary updates.
       */
      const updateResult =
        await Subscription.updateOne(
          {
            _id: subscription._id,
            status: 'active',
          },
          {
            $set: {
              status: 'expired',
            },
          },
        );

      /**
       * If another worker already processed it,
       * don't send notification again.
       */
      if (updateResult.modifiedCount === 0) {
        continue;
      }

      await User.updateOne(
        {
          _id: subscription.user,
        },
        {
          $pull: {
            subscription: subscription._id,
          },
        },
      );

      await sendNotifications({
        title:
          'Your subscription has been expired!',
        message:
          'Please renew your subscription to continue using our platform.',
        receiver: [subscription.user],
        isRead: false,
        filePath: 'subscription',
        referenceId: subscription._id,
      });
    }

    console.log(
      `Processed ${subscriptions.length} expired subscriptions`,
    );
  } catch (error) {
    await handleWorkerError(
      error,
      'suspendExpiredSubscriptions',
    );
  }
};

/**
 * Fetch third-party jobs.
 *
 * This function fetches multiple pages in one execution.
 */
const fetchNewData10TimesInDay = async () => {
  try {
    let cursor: number | undefined;

    for (
      let i = 0;
      i < JOB_FETCH_ITERATIONS;
      i++
    ) {
      const result =
        await jobspikrHelper.getJobs({
          jobtitles: highDemandJobs,
          limit: JOB_FETCH_LIMIT,
          ...(cursor
            ? {
                cursor,
              }
            : {}),
        });

      if (!result?.data?.length) {
        console.log(
          `No more jobs found at iteration ${i + 1}`,
        );

        break;
      }

      /**
       * Fetch all existing IDs in ONE query instead
       * of calling Post.exists() for every job.
       */
      const uniqueIds = result.data
        .map((job: any) => job.unique_id)
        .filter(Boolean);

      const existingPosts =
        await Post.find(
          {
            unique_id: {
              $in: uniqueIds,
            },
          },
          {
            unique_id: 1,
          },
        ).lean();

      const existingIds = new Set(
        existingPosts.map(
          post => post.unique_id,
        ),
      );

      const newJobs = result.data.filter(
        (job: any) =>
          job.unique_id &&
          !existingIds.has(job.unique_id),
      );

      if (newJobs.length) {
        /**
         * ordered:false allows other valid documents
         * to be inserted even if one duplicate occurs.
         */
        await Post.insertMany(newJobs, {
          ordered: false,
        });
      }

      console.log(
        `Job fetch ${i + 1}/${JOB_FETCH_ITERATIONS}: ${newJobs.length} new jobs`,
      );

      cursor = result.next_cursor;

      if (!cursor) {
        break;
      }
    }

    console.log(
      'Third-party job fetching completed',
    );
  } catch (error) {
    await handleWorkerError(
      error,
      'fetchNewData10TimesInDay',
    );
  }
};

/**
 * Fetch a single page of third-party jobs.
 *
 * Kept separately in case another part of the
 * application needs manual pagination.
 */
const fetchNewData = async (
  cursor?: number,
) => {
  try {
    const result =
      await jobspikrHelper.getJobs({
        jobtitles: highDemandJobs,
        limit: JOB_FETCH_LIMIT,
        ...(cursor
          ? {
              cursor,
            }
          : {}),
      });

    if (!result?.data?.length) {
      return;
    }

    const uniqueIds = result.data
      .map((job: any) => job.unique_id)
      .filter(Boolean);

    const existingPosts =
      await Post.find(
        {
          unique_id: {
            $in: uniqueIds,
          },
        },
        {
          unique_id: 1,
        },
      ).lean();

    const existingIds = new Set(
      existingPosts.map(
        post => post.unique_id,
      ),
    );

    const newJobs = result.data.filter(
      (job: any) =>
        job.unique_id &&
        !existingIds.has(job.unique_id),
    );

    if (newJobs.length) {
      await Post.insertMany(newJobs, {
        ordered: false,
      });
    }

    console.log(
      `Fetched ${newJobs.length} new jobs`,
    );

    return result.next_cursor;
  } catch (error) {
    await handleWorkerError(
      error,
      'fetchNewData',
    );
  }
};
