import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import validateRequest from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';
import { subscribeAuth } from '../../middlewares/subscribeAuth';
const router = express.Router();
router.route('/change-status/:id')
  .put(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),UserController.updateUserStatus)
router
  .route('/profile')
  .get(auth(), UserController.getUserProfile)
  .patch(
    auth(),
    fileUploadHandler(),
    (req: Request, res: Response, next: NextFunction) => {
      if (req.body.data) {
        req.body = UserValidation.updateUserZodSchema.parse(
          JSON.parse(req.body.data)
        );
      }
      return UserController.updateProfile(req, res, next);
    }
  );

router
  .route('/')
  .post(
    
    validateRequest(UserValidation.createUserZodSchema),
    UserController.createUser
  )
  .get(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UserController.getUserList);

router
  .route('/download-user-list')
  .get(auth(),UserController.userListDownLoad);
  

router
  .route('/gallery')
  .post(
    auth(USER_ROLES.RECRUITER),
    fileUploadHandler(),
    UserController.createGallery
  )
  .get(auth(), UserController.getGallery)

router
  .route('/gallery/:id')
  .delete(auth(USER_ROLES.RECRUITER, USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN), UserController.deleteGallery)

router
  .route('/education')
  .post(
    auth(USER_ROLES.EMPLOYEE),
    validateRequest(UserValidation.addEducationZodSchema),
    UserController.addEducation
  )

router
  .route('/education/:id')
  .delete(auth(USER_ROLES.EMPLOYEE), UserController.deleteEducation)
  .patch(
    auth(USER_ROLES.EMPLOYEE),
    UserController.updateEducation
  )

router
  .route('/work-experience')
  .post(
    auth(USER_ROLES.EMPLOYEE),
    validateRequest(UserValidation.addWorkExperienceZodSchema),
    UserController.addworkExperience
  )

router
  .route('/work-experience/:id')
  .delete(auth(USER_ROLES.EMPLOYEE), UserController.deleteWorkExperience)
  .patch(
    auth(USER_ROLES.EMPLOYEE),
    UserController.updateWorkExperience
  )
router
  .route('/analyze-resume')
  .post(
    fileUploadHandler(),
    auth(),
    subscribeAuth(["silver","gold"]),
    validateRequest(UserValidation.analyzeResumeZodSchema),
    UserController.anlaizeUserResume
  )
router
  .route('/analyze-resume/:id')
  .get(
    UserController.getResultOfResumeAnalysis
  )
router
  .route('/recruiter/:id')
  .get(
    auth(),
    UserController.getRecruiterDetailsById
  )

  router.route('/auto-apply')
  .post(
    auth(USER_ROLES.EMPLOYEE),
    UserController.toggleAutoApply
  )

  router.delete('/delete-account',auth(),UserController.deleteAccount)


export const UserRoutes = router;
