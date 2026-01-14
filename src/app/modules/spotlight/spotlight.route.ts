import express from 'express';
import { SpotlightController } from './spotlight.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { SpotlightValidations } from './spotlight.validation';
import validateRequest from '../../middlewares/validateRequest';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import tempAuth from '../../middlewares/tempAuth';

const router = express.Router();

router.route("/")
    .post(auth(USER_ROLES.RECRUITER),fileUploadHandler(),validateRequest(SpotlightValidations.createSpotlightZodSchema),SpotlightController.createSpotlight)
    .get(tempAuth(),SpotlightController.getSpotlights)

router.route("/change-status/:id")
    .patch(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),validateRequest(SpotlightValidations.approvedSpotlightZodSchema),SpotlightController.approveSpotlight)

router.route("/:id")
    .patch(auth(USER_ROLES.RECRUITER),fileUploadHandler(),validateRequest(SpotlightValidations.updateSpotlightZodSchema),SpotlightController.updateSpotlight)
    .delete(auth(USER_ROLES.RECRUITER),SpotlightController.deleteSpotlight)

export const SpotlightRoutes = router;
