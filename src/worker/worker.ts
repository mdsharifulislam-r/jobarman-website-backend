import cron from 'node-cron';
import { IUser } from '../app/modules/user/user.interface';
import { Application } from '../app/modules/application/application.model';
import { Post } from '../app/modules/post/post.model';
import { AIHelper } from '../helpers/aiHelper';
import { User } from '../app/modules/user/user.model';
import { USER_ROLES } from '../enums/user';

export const startWorker = () => {
  cron.schedule('* * * * *', () => {
    // AutoApply();
    console.log('Cron Job Runned');
    
  });
};

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

    const postIds = applications.map(app => app.post);
    let post = await Post.find({
      _id: { $nin: postIds },
      deadline: { $gte: new Date() },
      status: 'active',
    })
      .limit(50)
      .lean();
    post = post.map(post => ({
      ...post,
      _id: post._id.toString(),
      recruiter: post.recruiter.toString(),
      category: post.category.toString(),
    })) as any;
    const aiSuggesstionPost = await AIHelper.getJobMatchAutoApplyPersentances(
      user._id,
      20,
      '',
      post as any
    );
    await Promise.all(
      aiSuggesstionPost.map(async (postId: any) => {
        await Application.create({
          user: user._id,
          post: postId._id,
          recruiter: postId.recruiter,
          title: postId.title,
          jobMatch: postId.jobMatch,
          isAutoApplied: true,
          resume: user.resume,
          year_of_experience: `2 years`,
        });
      })
    );

    console.log(`Auto Applyed ${aiSuggesstionPost.length} post`);
  } catch (error) {
    console.log(error);
  }
};
