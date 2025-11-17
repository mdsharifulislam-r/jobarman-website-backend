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

export const ApplicationRoutes = router;
