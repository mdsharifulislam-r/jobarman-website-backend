import express from 'express';
import { ResumeController } from './resume.controller';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ResumeValidations } from './resume.validation';
import fileUploadHandler from '../../middlewares/fileUploadHandler';

const router = express.Router();

router.route("/")
    .post(auth(),validateRequest(ResumeValidations.ResumeSchema),ResumeController.createResume)
    .get(auth(),ResumeController.getAllResumes)

router.route("/external-resume")
    .post(auth(),fileUploadHandler(),validateRequest(ResumeValidations.createExternalResumeZodSchema),ResumeController.createResumeIntoExternalPdf)
router.route("/external-resume/:id")
    .patch(auth(),fileUploadHandler(),ResumeController.updateResumeExternalPdf)
router.route("/:id")
    .patch(auth(),validateRequest(ResumeValidations.ResumeSchema.partial()),ResumeController.updateResume)
    .delete(auth(),ResumeController.deleteResume)
    .get(auth(),ResumeController.getResume)


export const ResumeRoutes = router;
