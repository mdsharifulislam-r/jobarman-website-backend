import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { FaqValidation } from './faq.validation';
import { FaqController } from './faq.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.post('/',auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN),validateRequest(FaqValidation.createFaqZodSchema),FaqController.createFaq)

router.get('/',FaqController.getAllFaqs)

router.put('/:id',auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN),validateRequest(FaqValidation.updateFaqZodSchema),FaqController.updateFaq)

router.delete('/:id',auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN),FaqController.deleteFaq)

export const FaqRoutes=router
