import express from 'express';
import auth from '../../middlewares/auth';
import { ChatController } from './chat.controller';
import { USER_ROLES } from '../../../enums/user';
import { subscribeAuth } from '../../middlewares/subscribeAuth';
const router = express.Router();

router.post(
  '/:id',
  auth(),
  subscribeAuth(["silver","gold","bronze"]),
  ChatController.createChat
);
router.get(
  '/',
  auth(),
  ChatController.getChat
);

router.get(
  '/:id',
  auth(),
  ChatController.singleChatDetails
)
export const ChatRoutes = router;
