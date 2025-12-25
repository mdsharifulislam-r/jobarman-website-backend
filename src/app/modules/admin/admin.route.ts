import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { AdminController } from './admin.controller';
import validateRequest from '../../middlewares/validateRequest';
import { AdminValidation } from './admin.validation';

const router = express.Router();

router.post(
    '/',
    auth(USER_ROLES.SUPER_ADMIN),
    validateRequest(AdminValidation.createAdminZodSchema),
    AdminController.createAdmin
);

router.route('/spotlight/price')
.post(
 
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    validateRequest(AdminValidation.createPriceForSpotlightZodSchema),
    AdminController.createPriceForSpotlight
).get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    AdminController.getCurrentPriceForSpotlight
);

router.get(
    '/company-info',
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    AdminController.getCompanyInfoForExpiredJobs
);
router.get(
    '/',
    auth(USER_ROLES.SUPER_ADMIN),
    AdminController.getAdmin
);

router.delete(
    '/:id',
    auth(USER_ROLES.SUPER_ADMIN),
    AdminController.deleteAdmin
);

router.patch(
    '/:id',
    auth(USER_ROLES.SUPER_ADMIN),
    AdminController.updateAdminInfo
);



export const AdminRoutes = router;
