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
import { Category } from '../app/modules/category/category.model';
import { Jobs } from 'openai/resources/fine-tuning/jobs/jobs';
import { jobspikrHelper } from '../helpers/jobspkrHelper';
export const startWorker = () => {
  cron.schedule('0 0 * * *',async () => {
   await AutoApply();
    getUserInfoAndSendEmailToThem();
    await deleteExpireJobsPosts();
    await suspendExpiredSubscriptions();
    await fetchNewData();
    console.log('Cron Job Runned');
    
  });
};


const getUserInfoAndSendEmailToThem = async () => {
  // only for those user those are get job update more than 1 day ago
try {
  const users = await User.find({role:USER_ROLES.EMPLOYEE,verified:true,status:'active',subscription:{$exists:true}},{designation:1,educations:1,workExperiences:1,skills:1}).sort({createdAt:-1}).limit(1).lean()
  if(users.length===0){
    return;
  }
  const getAiSuggestion = await AIHelper.analizeUserInfoAndGenerateMetaInformation(users as any);

  for(const userInfo of getAiSuggestion){
    await kafkaProducer.sendMessage("post",{type:"send-job-match-email",data:userInfo})
  }


}
catch (error) {
  console.log(error);
  
}

}

async function AutoApply() {
    const users = await User.find({role:USER_ROLES.EMPLOYEE,verified:true,status:'active',isAutoApply:true}).lean()
    await Promise.all(users.map(user=>matchAndApplyPost(user as any)));
}

export const matchAndApplyPost = async (user: IUser & { _id: string }) => {
  try {
    const applications = await Application.find(
      { user: user._id },
      { _id: 1, post: 1 }
    ).lean();

    const subscriptionBasedLimit = await subscriptionHelper.isPremiumUser(user._id,"bronze")?10:(await subscriptionHelper.isPremiumUser(user._id,"gold") || await subscriptionHelper.isPremiumUser(user._id,"silver"))?1000000:0

    const postIds = applications.map(app => app.post);
    let post = await Post.find({
      _id: { $nin: postIds },
      deadline: { $gte: new Date() },
      status: 'active',
    })
      .lean();
    post = post.map(post => ({
      ...post,
      _id: post._id.toString(),
      recruiter: post?.recruiter?.toString(),
      category: post?.category?.toString(),
    })) as any;
    const aiSuggesstionPost = await AIHelper.getJobMatchAutoApplyPersentances(
      user._id,
      20,
      '',
      post as any
    )
    await Promise.all(
      aiSuggesstionPost?.slice(0,subscriptionBasedLimit)?.map(async (postId: any) => {
        await Application.create({
          user: user._id,
          post: postId._id,
          recruiter: postId.recruiter,
          title: postId.title,
          jobMatch: postId.jobMatch,
          isAutoApplied: true,
          resume: user.resume,
          year_of_experience: `2`,
        });
      })
    );

    console.log(`Auto Applyed ${aiSuggesstionPost.length} post`);
  } catch (error) {
    console.log(error);
  }

};


const deleteExpireJobsPosts = async () => {
  //post date less than 30 days or deadline passed
 try {
   const expireJobs = await Post.find({ $or: [{ deadline: { $lt: new Date() } }, {post_date:{$lt:new Date(new Date().setDate(new Date().getDate() - 30))}}],is_third_party_job:true }).lean();
  const arr:ICompanyInfo[] = [];
  await Promise.all(expireJobs.map(async (job) => {

    if(true){
      const isExist = await CompanyInfo.findOne({company_name:job.recruiter_company,contact_email:job.company_contact_email});
      if(isExist){
        return;
      }
      arr.push({
        contact_email:job.company_contact_email! || '',
        company_name:job.recruiter_company||'',
        job_url:job.job_url||'',
        company_logo:job.thumbnail||'',
        company_address:job.location||'',
      });
    }

    // await Post.deleteOne({ _id: job._id });
    
  }));

  if(arr.length>0){
    await CompanyInfo.insertMany(arr);
  }
  console.log(`Deleted ${expireJobs.length} expired jobs`);
 } catch (error) {
  console.log(error);
  
 }
}

const suspendExpiredSubscriptions = async () => {
  try {
    const subscriptions = await Subscription.find({ status: 'active', end_date: { $lt: new Date() } }).lean();
    await Promise.all(subscriptions.map(async (subscription) => {
      await Subscription.updateOne({ _id: subscription._id }, { status: 'expired' });
      await User.updateOne({ _id: subscription.user }, { $pull: { subscription: subscription._id } });
      await sendNotifications({
        title: `Your subscription has been expired!`,
        message: `Please renew your subscription to continue using our platform.`,
        receiver: [subscription.user],
        isRead: false,
        filePath: "subscription",
        referenceId: subscription._id,
      })
    }));
    console.log(`Suspended ${subscriptions.length} expired subscriptions`);
  } catch (error) {
    console.log(error);
  }
};

const jobTitles = [
  // IT Jobs
  "Backend Developer",
  "Frontend Developer",
  "Full Stack Developer",
  "Software Engineer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Database Administrator",
  "QA Engineer",
  "Mobile App Developer",
  "System Administrator",
  "Cybersecurity Analyst",
  "AI/ML Engineer",
  "Data Engineer",
  "Data Scientist",

  // Medical Jobs
  "Doctor",
  "Nurse",
  "Pharmacist",
  "Lab Technician",
  "Surgeon",
  "Physiotherapist",
  "Dentist",
  "Medical Assistant",
  "Radiologist",
  "Paramedic",
  "Nutritionist",
  "Cardiologist",
  "Dermatologist",
  "Pediatrician"
];

const fetchNewData = async ()=>{
  const getThirdPartyJobs = await jobspikrHelper.getJobs({
    jobtitles: jobTitles,
    limit:1000
  })

  await Post.insertMany(getThirdPartyJobs?.data);

  console.log(`Fetched ${getThirdPartyJobs.data?.length} new jobs`);
  
}