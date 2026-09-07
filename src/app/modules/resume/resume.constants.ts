export const RESUME_CONSTANT = 'someValue';
export const demoRsumeExtractedData = {
  "date_of_birth": "1998-05-20",
  "nationality": "Bangladeshi",
  "language": "English",
  "address": "Dhaka",
  "linkedin": "https://linkedin.com/in/johndoe",
  "designation": "Software Engineer",
  "assumptions_designations": ["Software Engineer", "Full-stack Developer", "Backend Developer","Senior Software Engineer"],
  "bio": "Full-stack developer with 5 years of experience.",
  "educations": [
    {
      "degree": "BSc in Computer Science",
      "institute": "ABC University",
      "startDate": "2016-01-01",
      "session": "2016-2020",
      "endDate": "2020-12-01",
      "passingYear": 2020,
      "grade": "3.75"
    }
  ],
  "workExperiences": [
    {
      "title": "Software Engineer",
      "company": "Tech Corp",
      "startDate": "2021-01-01",
      "endDate": "2024-01-01",
      "description": "Built web applications and APIs.",
      "location": "Dhaka",
      "isCurrentJob": false
    }
  ],
  "skills": ["Node.js", "TypeScript", "MongoDB"],
  "job_level": "MID_LEVEL"
}

export const resumeExtractorPromptMaker = (resumeData: string | object) => {
    
  const outputSchema = JSON.stringify(demoRsumeExtractedData);

  if (typeof resumeData === "object") {
    return `
You are an expert AI resume extraction system.

Analyze the provided resume JSON and extract the candidate's information.

RESUME DATA:
${JSON.stringify(resumeData)}

OUTPUT SCHEMA:
${outputSchema}

IMPORTANT:
- The OUTPUT SCHEMA is ONLY a structural example. It is NOT actual candidate data.
- Never copy values from the OUTPUT SCHEMA.
- Extract the actual information from the RESUME DATA.
- Return the extracted information using exactly the same field names and structure.
- assume realistic designations based on the candidate's experience and skills.
- Extract all available education, work experience, skills, and profile information.
- If any information is missing from the resume, make a reasonable and realistic assumption based on the available context.
- Do NOT leave fields empty if a reasonable assumption can be made.
- Keep assumptions consistent with the candidate's other information.
- Do not create unrealistic or contradictory information.
- Convert dates to YYYY-MM-DD format.
- Return skills as an array of individual strings.
- Job level should be one of the following: "ENTRY_LEVEL", "MID_LEVEL", "SENIOR_LEVEL".
- Return ONLY valid JSON.
- Do not return markdown, explanations, comments, or any additional text.

Return the final extracted candidate data as JSON.
`;
  }

  return `
You are an expert AI resume extraction system.

A resume file has been provided to you.

FILE ID:
${resumeData}

IMPORTANT:
- Analyze the ACTUAL CONTENT of the attached/provided resume file.
- The file ID above is only an identifier. It is NOT resume content.
- Do NOT generate information based on the file ID itself.
- Extract the candidate's actual information from the resume file.
- Use the output schema below ONLY to understand the required structure and field names.
- The schema values are examples only and MUST NOT be copied.

OUTPUT SCHEMA:
${outputSchema}

EXTRACTION RULES:
- Extract all available information from the resume.
- Extract all education records.
- Extract all work experience records.
- Extract all relevant skills.
- Extract personal/profile information when available.
- If any information is missing, make a reasonable assumption based on the resume's context.
- Do NOT leave a field empty when a reasonable assumption can be made.
- Keep assumptions realistic and consistent with the candidate's experience.
- Do not create contradictory information.
- Convert dates to YYYY-MM-DD format.
- Dont give any string value for date_of_birth or any dates like startDate and endDate if it is not available in the resume.at this can left null.
- Return skills as an array of individual strings.
- assume realistic designations based on the candidate's experience and skills.
- Job level should be one of the following: "ENTRY_LEVEL", "MID_LEVEL", "SENIOR_LEVEL".
- Keep the exact field names and structure from the output schema.
- Do not add additional fields.
- Return ONLY valid JSON.
- Do not return markdown, explanations, comments, or any additional text.

The final response must contain ONLY the extracted candidate JSON.
`;
};