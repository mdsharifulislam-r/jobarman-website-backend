import express from 'express';
import { ApplicationController } from './application.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middlewares/validateRequest';
import { ApplicationValidations } from './application.validation';
import fileUploadHandler from '../../middlewares/fileUploadHandler';

const router = express.Router();

router.route("/")
    .post(auth(USER_ROLES.EMPLOYEE),fileUploadHandler(),validateRequest(ApplicationValidations.createApplicationZodSchema),ApplicationController.createApplication)
    .get(auth(),ApplicationController.getApplications)

router.route('/user')
    .get(auth(USER_ROLES.EMPLOYEE),ApplicationController.getApplicationsByUser)

router.route("/feedback/:id")
    .post(auth(USER_ROLES.RECRUITER),validateRequest(ApplicationValidations.sendFeedBackSchema),ApplicationController.sendFeedBackofInterview)
router.route("/auto-apply")
    .post(auth(USER_ROLES.EMPLOYEE),fileUploadHandler(),validateRequest(ApplicationValidations.autoApplySchema),ApplicationController.autoApplyFeaturesForUser)
router.route("/auto-apply/:id")
    .get(auth(USER_ROLES.EMPLOYEE),ApplicationController.autoApplyResultsForUser)
router.post("/start-interview/:id",auth(USER_ROLES.RECRUITER),ApplicationController.startInterview)
router.patch("/interview-change-time/:id",auth(USER_ROLES.RECRUITER),validateRequest(ApplicationValidations.changeInterviewDetailsZodSchema),ApplicationController.changeTimedateOfIterview)
router.delete("/cancel-interview/:id",auth(USER_ROLES.RECRUITER),validateRequest(ApplicationValidations.changeInterviewDetailsZodSchema),ApplicationController.cancelInterview)
router.get("/recent-applications",ApplicationController.recentApplications)
router.route("/:id")
    .patch(auth(USER_ROLES.RECRUITER),fileUploadHandler(),validateRequest(ApplicationValidations.changeStatusSchema),ApplicationController.updateStatusOfApplications)
    .delete(auth(USER_ROLES.RECRUITER, USER_ROLES.EMPLOYEE),ApplicationController.deleteApplication)
    .get(auth(USER_ROLES.RECRUITER, USER_ROLES.EMPLOYEE),ApplicationController.getApplication)

export const ApplicationRoutes = router;
