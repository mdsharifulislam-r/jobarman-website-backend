import express from 'express';
import { ResumeController } from './resume.controller';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ResumeValidations } from './resume.validation';

const router = express.Router();

router.route("/")
    .post(auth(),validateRequest(ResumeValidations.ResumeSchema),ResumeController.createResume)
    .get(auth(),ResumeController.getAllResumes)

router.route("/:id")
    .patch(auth(),validateRequest(ResumeValidations.ResumeSchema.partial()),ResumeController.updateResume)
    .delete(auth(),ResumeController.deleteResume)


export const ResumeRoutes = router;
