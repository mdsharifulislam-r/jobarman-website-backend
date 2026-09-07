export const APPLICATION_CONSTANT = 'someValue';

export const demoApplicationExtractedData = {
  designation: 'Software Engineer',
  skills: ['Node.js', 'TypeScript', 'aws'],
};

export const applicationExtractorPromptMaker = (
  applicationData: string | object,
)  => {
  const outputSchema = JSON.stringify(demoApplicationExtractedData);

  if (typeof applicationData === 'object') {
    return `
You are an expert AI application extraction system.

Analyze the provided application JSON and extract the candidate's information.

APPLICATION DATA:
${JSON.stringify(applicationData)}
OUTPUT SCHEMA:
${outputSchema}

IMPORTANT:
- The OUTPUT SCHEMA is ONLY a structural example. It is NOT actual candidate data.
- Never copy values from the OUTPUT SCHEMA.
- Extract the actual information from the APPLICATION DATA.
- Return the extracted information using exactly the same field names and structure.
- assume realistic designations based on the candidate's experience and skills.
- assume realistic keywords based on the candidate's experience and skills.

Additional Instructions:
- Extract all available skills and profile information.
- If any information is missing from the application, make a reasonable and realistic assumption based on the available context.
- Do NOT leave fields empty if a reasonable assumption can be made.
- Return skills as an array of individual strings.
- assume realistic designations based on the candidate's experience and skills.
- assume realistic keywords based on the candidate's experience and skills.
- Keep assumptions consistent with the candidate's other information.
- Do not create unrealistic or contradictory information.
- Return ONLY valid JSON.
- Do not return markdown, explanations, comments, or any additional text.

Return the final extracted candidate data as JSON.
`;
  }

  return `
You are an expert AI application extraction system.

An application file has been provided to you.

Extract the candidate's information from the application file.

APPLICATION FILE:
${applicationData}
OUTPUT SCHEMA:
${outputSchema}

IMPORTANT:
- The OUTPUT SCHEMA is ONLY a structural example. It is NOT actual candidate data.
- Never copy values from the OUTPUT SCHEMA.
- Extract the actual information from the APPLICATION FILE.
- Return the extracted information using exactly the same field names and structure.
- assume realistic designations based on the candidate's experience and skills.
- assume realistic keywords based on the candidate's experience and skills.

Additional Instructions:
- Extract all available skills and profile information.
- If any information is missing from the application, make a reasonable and realistic assumption based on the available context.
- Do NOT leave fields empty if a reasonable assumption can be made.
- Return skills as an array of individual strings.
- assume realistic designations based on the candidate's experience and skills.
- assume realistic keywords based on the candidate's experience and skills.
- Keep assumptions consistent with the candidate's other information.
- Do not create unrealistic or contradictory information.
- Return ONLY valid JSON.
- Do not return markdown, explanations, comments, or any additional text.

Return the final extracted candidate data as JSON.
`;
};
