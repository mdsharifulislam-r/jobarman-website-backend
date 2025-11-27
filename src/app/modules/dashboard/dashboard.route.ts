import express from 'express';
import { DashboardController } from './dashboard.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.get('/summury',auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN), DashboardController.getSummuryFromDb);
router.get('/weekly-report',auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN), DashboardController.getWeeklyReport);
router.get('/monthly-report',auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN), DashboardController.monthlyReport);
router.get('/manual-report',auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN), DashboardController.getManuallyReport);


export const DashboardRoutes = router;
