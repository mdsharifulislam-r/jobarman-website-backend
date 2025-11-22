import express from 'express';
import { AuthRoutes } from '../app/modules/auth/auth.route';
import { UserRoutes } from '../app/modules/user/user.route';
import { PackageRoutes } from '../app/modules/package/package.route';
import { SubscriptionRoutes } from '../app/modules/subscription/subscription.route';
import { CategoryRoutes } from '../app/modules/category/category.route';
import { PostRoutes } from '../app/modules/post/post.route';
import { DisclaimerRoutes } from '../app/modules/disclaimer/disclaimer.route';
import { SupportRoutes } from '../app/modules/support/support.route';
import { ResumeRoutes } from '../app/modules/resume/resume.route';
import { ApplicationRoutes } from '../app/modules/application/application.route';
import { ChatRoutes } from '../app/modules/chat/chat.routes';
import { MessageRoutes } from '../app/modules/message/message.routes';
import { NotificationRoutes } from '../app/modules/notification/notification.routes';
import { SpotlightRoutes } from '../app/modules/spotlight/spotlight.route';
import { ReviewRoutes } from '../app/modules/review/review.route';
const router = express.Router();

const apiRoutes = [
  {
    path: '/user',
    route: UserRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/package',
    route: PackageRoutes,
  },

  {
    path:"/subscription",
    route: SubscriptionRoutes
  },
  {
    path:"/job-category",
    route: CategoryRoutes
  },
  {
    path:"/job-post",
    route: PostRoutes
  },
  {
    path:"/disclaimer",
    route: DisclaimerRoutes
  },
  {
    path:"/support",
    route: SupportRoutes
  },
  {
    path:"/resume",
    route: ResumeRoutes
  },
  {
    path:"/application",
    route: ApplicationRoutes
  },
  {
    path:"/chat",
    route: ChatRoutes
  },
  {
    path:"/message",
    route: MessageRoutes
  },
  {
    path:"/notification",
    route: NotificationRoutes
  },
  {
    path:"/spotlight",
    route: SpotlightRoutes
  },
  {
    path:"/review",
    route: ReviewRoutes
  }

];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
