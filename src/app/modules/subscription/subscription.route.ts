import express from 'express';
import { SubscriptionController } from './subscription.controller';
import validateRequest from '../../middlewares/validateRequest';
import { SubscriptionValidation } from './subscription.validation';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
const router = express.Router();

router.route("/subscribe")
.post(
  validateRequest(SubscriptionValidation.createSubsciptionZodSchema),
  SubscriptionController.createSubsciption
).get(
  auth(),
  SubscriptionController.getSubscription
)

router.route("/demo")
.post(
  validateRequest(SubscriptionValidation.createSubsciptionZodSchema),
  SubscriptionController.demoSubscription
)

router.route("/stripe")
.post(
  auth(),
  validateRequest(SubscriptionValidation.createSubsciptionZodSchema),
  SubscriptionController.stripeSubscription
)

router.route("/stripe/renew")
.post(
  auth(),
  SubscriptionController.renewSubscription
)

router.route("/subscribers")
.get(
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  SubscriptionController.getSubscribers
)

router.route("/transactions")
.post(
  auth(),
  SubscriptionController.getTransactions
)
router.get("/transactions-by-otp",auth(), SubscriptionController.transactionByOtp)
router.route("/details/:id")
.get(
  auth(),
  SubscriptionController.getSubscriptionDetailsById
)

router.route("/subscribed-users")
.get(
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  SubscriptionController.getSubscribersUsers
)

export const SubscriptionRoutes = router;