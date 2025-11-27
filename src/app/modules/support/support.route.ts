import express from 'express';
import { SupportController } from './support.controller';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { SupportValidations } from './support.validation';
import { USER_ROLES } from '../../../enums/user';
import fileUploadHandler from '../../middlewares/fileUploadHandler';

const router = express.Router();

router.route("/")
    .post(auth(),fileUploadHandler(),validateRequest(SupportValidations.createSupportZodSchema),SupportController.createSupport)
    .get(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),SupportController.getAllSupport)
router.route("/:id")
    .delete(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),SupportController.deleteSupport)
    .patch(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),fileUploadHandler(),validateRequest(SupportValidations.replySupportZodSchema),SupportController.replySupport)
export const SupportRoutes = router;
