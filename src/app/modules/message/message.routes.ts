import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { MessageController } from './message.controller';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import validateRequest from '../../middlewares/validateRequest';
import { MessageValidation } from './message.validation';

const router = express.Router();

router.post(
  '/',
  fileUploadHandler(),
  auth(),
  validateRequest(MessageValidation.createMessageZodSchema),
  MessageController.sendMessage
);
router.get(
  '/:id',
  auth(),
  MessageController.getMessage
);

export const MessageRoutes = router;
