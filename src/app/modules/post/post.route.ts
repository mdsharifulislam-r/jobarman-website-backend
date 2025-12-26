import express from 'express';
import { PostController } from './post.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import validateRequest from '../../middlewares/validateRequest';
import { PostValidations } from './post.validation';

const router = express.Router();

router.route("/")
    .post(auth(USER_ROLES.RECRUITER),fileUploadHandler(),validateRequest(PostValidations.createPostZodSchema), PostController.createPost)

router.route("/feed")
    .get(PostController.getPostFeed)

router.route("/recent-posts")
    .get( PostController.getRecentsPosts)
router.route("/recommended")
    .get(auth(), PostController.getRecommendedPosts)

router.route("/feed/user")
    .get(auth(), PostController.getPosts)

router.route("/insights/:id")
    .get(auth(USER_ROLES.RECRUITER), PostController.getPostInsigts)

router.route("/:id")
    .patch(auth(USER_ROLES.RECRUITER),fileUploadHandler(),validateRequest(PostValidations.updatePostZodSchema), PostController.updatePost)
    .delete(auth(), PostController.deletePost)
    .get( PostController.getPost)

export const PostRoutes = router;
