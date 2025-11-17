import express from 'express';
import { PackageController } from './package.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { PackageValidation } from './package.validation';
import validateRequest from '../../middlewares/validateRequest';

const router = express.Router();
router.route("/")
    .post(auth(),validateRequest(PackageValidation.createPackageZodSchema), PackageController.createPackage)
    .get(PackageController.getAllPackages)


router.route("/:id")
    .patch(auth(),validateRequest(PackageValidation.updatePackageZodSchema), PackageController.updatePackage)
    .delete(auth(), PackageController.deletePackage)

export const PackageRoutes = router;
