import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';
import passport from 'passport';
import passportHelper from '../../../tools/passport/passport';
import ApiError from '../../../errors/ApiError';
import { IUser } from '../user/user.interface';
import { jwtHelper } from '../../../helpers/jwtHelper';
import config from '../../../config';
import { Secret } from 'jsonwebtoken';
const router = express.Router();

router.post(
  '/login',
  validateRequest(AuthValidation.createLoginZodSchema),
  AuthController.loginUser
);

router.post(
  '/forget-password',
  validateRequest(AuthValidation.createForgetPasswordZodSchema),
  AuthController.forgetPassword
);

router.post(
  '/verify-email',
  validateRequest(AuthValidation.createVerifyEmailZodSchema),
  AuthController.verifyEmail
);

router.post(
  '/reset-password',
  validateRequest(AuthValidation.createResetPasswordZodSchema),
  AuthController.resetPassword
);

router.post(
  '/change-password',
  auth(),
  validateRequest(AuthValidation.createChangePasswordZodSchema),
  AuthController.changePassword
);

router.post(
  '/social-sign-in',
  AuthController.socialSignIn
);

router.get('/google-sign-in',(req,res,next)=>{
  if(!req.query.role){
    throw new ApiError(400,'Role is required');
  }
  passportHelper.passport.authenticate('google', { scope: ['email', 'profile'],state:req.query.role as any})(req, res, next);
}, );

router.get('/google/callback', passportHelper.passport.authenticate('google', { session: false }), (req, res) => {

  const user = req.user as any as IUser&{_id:string};
  
  const accessToken = jwtHelper.createToken({ id: user._id, role: user.role, email: user.email }, config.jwt.jwt_secret as Secret, config.jwt.jwt_expire_in as string);
  const refreshToken = jwtHelper.createToken({ id: user._id, role: user.role, email: user.email }, config.jwt.jwt_secret as Secret, "25d");

  res.redirect(`${config.urls.frontend_url}?accessToken=${accessToken}&refreshToken=${refreshToken}&role=${user.role}`);
  
});

router.get('/linkedin-sign-in',(req,res,next)=>{
  // if(!req.query.role){
  //   throw new ApiError(400,'Role is required');
  // }
  passportHelper.passport.authenticate('linkedin', { scope: [ "profile", "email"],state:req.query.role as any})(req, res, next);
}, );

router.get('/linkedin/callback', passportHelper.passport.authenticate('linkedin', { session: false }), (req, res) => {

  const user = req.user as any as IUser&{_id:string};
  console.log(user);
  
  res.redirect(`${config.urls.frontend_url}`);
  
});


export const AuthRoutes = router;
