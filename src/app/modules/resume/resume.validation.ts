import { z } from 'zod';

export const EducationSchema = z.object({
  degree: z.string().optional(),
  institute: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  passingYear: z.number().optional(),
  grade: z.string().optional(),
  _id: z.string().optional(),
});

export const WorkExperienceSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  isCurrentJob: z.boolean().optional(),
  designation: z.string().optional(),
  _id: z.string().optional(),
});

export const ResumeSchema = z.object({
  body: z
    .object({
      resume_name: z.string().optional(),

      personalInfo: z
        .object({
          full_name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          social_media_link: z.string().optional(),
          github_link: z.string().optional(),
          work_authorization: z.string().optional(),
          clearance: z.string().optional(),
          open_to_work: z.string().optional(),
          summury: z.string().optional(),
          address: z.string().optional(),
          date_of_birth: z.string().optional(),
          age: z.number().optional(),
          nationality: z.string().optional(),
          language: z.string().optional(),
          gender: z.string().optional(),
        })
        .optional(),

      educations: z.array(EducationSchema).optional(),

      workExperiences: z.array(WorkExperienceSchema).optional(),

      skills: z.array(z.string()).optional(),

      core_features: z
        .array(
          z.object({
            title: z.string().optional(),
            description: z.string().optional(),
          })
        )
        .optional(),

      projects: z
        .array(
          z.object({
            title: z.string().optional(),
            description: z.string().optional(),
            link: z.string().optional(),
          })
        )
        .optional(),

      certifications: z
        .array(
          z.object({
            title: z.string().optional(),
            description: z.string().optional(),
            link: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

export const ResumeValidations = {
  ResumeSchema,
};
