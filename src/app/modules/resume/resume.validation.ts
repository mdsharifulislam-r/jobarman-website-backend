import { z } from 'zod';

export const EducationSchema = z.object({
  degree: z.string(),
  institute: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  passingYear: z.number(),
  grade: z.string(),
  _id: z.string().optional(),
});

// Work Experience Schema
export const WorkExperienceSchema = z.object({
  title: z.string(),
  company: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  description: z.string(),
  location: z.string(),
  isCurrentJob: z.boolean(),
  designation: z.string(),
  _id: z.string().optional(),
});

// IResume Schema
export const ResumeSchema = z.object({
    body:z.object({
  resume_name: z.string(),

  personalInfo: z.object({
    full_name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    social_media_link: z.string(),
    github_link: z.string(),
    work_authorization: z.string(),
    clearance: z.string(),
    open_to_work: z.string(),
    summury: z.string(),
    address: z.string(),
    date_of_birth: z.string(),   // ISO Date
    age: z.number(),
    nationality: z.string(),
    language: z.string(),
    gender: z.string(),
  }),

  educations: z.array(EducationSchema),

  workExperiences: z.array(WorkExperienceSchema),

  skills: z.array(z.string()),

  core_features: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    })
  ),

  projects: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      link: z.string().optional(),
    })
  ),

  certifications: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
      link: z.string().optional(),
    })
  ),
})
})
export const ResumeValidations = {
    ResumeSchema
};
