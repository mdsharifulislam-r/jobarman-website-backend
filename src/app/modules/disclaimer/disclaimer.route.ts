import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { DisclaimerController } from './disclaimer.controller';
import validateRequest from '../../middlewares/validateRequest';
import { DisclaimerValidation } from './disclaimer.validation';

const router = express.Router();

router.route("/")
    .post(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),validateRequest(DisclaimerValidation.createDisclaimerZodSchema), DisclaimerController.createDisclaimer)
    .get(DisclaimerController.getDisclaimer)

export const DisclaimerRoutes = router;