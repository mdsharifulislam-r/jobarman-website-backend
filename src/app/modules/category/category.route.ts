import express from 'express';
import { CategoryController } from './category.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import validateRequest from '../../middlewares/validateRequest';
import { CategoryValidations } from './category.validation';

const router = express.Router();

router.route("/")
    .post(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),fileUploadHandler(),validateRequest(CategoryValidations.createCategoryZodSchema), CategoryController.createCategory)
    .get(CategoryController.getAllCategory) 

router.route("/:id")
    .patch(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),fileUploadHandler(),validateRequest(CategoryValidations.updateCategoryZodSchema), CategoryController.updateCategory)
    .delete(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), CategoryController.deleteCategory)

export const CategoryRoutes = router;
