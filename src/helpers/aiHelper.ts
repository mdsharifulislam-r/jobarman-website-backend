import { Types } from "mongoose";
import { IPost } from "../app/modules/post/post.interface";
import { Post } from "../app/modules/post/post.model";
import { IUser } from "../app/modules/user/user.interface";
import { User } from "../app/modules/user/user.model";
import { chatbot } from "../config/open-ai.config";
import { encode } from "@toon-format/toon";
const askAI = async (prompt: string,fileId?:string) => {
  const completion = await chatbot.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a job recommendation engine. Return only valid JSON." },
      { role: "user", content: [
        {
          type: "text",
          text: prompt
        },
        ...(fileId ? [{
          type: "file",
          file:{
            file_id: fileId
          }
        }] : [] as any)
      ] }
    ]
  });

  const raw = completion.choices[0].message.content || "";
  console.log(raw);
  
  const clean = raw.replace(/\n/g, "").replace(/```json|```/g, "").trim();

  return JSON.parse(clean);
};


const getJobMatchPercentances = async (userId: string,postId: string):Promise<{matchPercentage: number}> => {
   
    
    console.log('ai is starting the calculation'); 
    const user = await User.findById(userId)?.lean();
    const post = await Post.findById(postId)?.lean();

    if(!user || !post){
        return {matchPercentage: 0}
    }

    const userSkills = user.skills
    const userEducation = user.educations
    const userWorkExperience = user.workExperiences

    const prompt = `
Here is the user profile data:

userSkills: ${encode(userSkills)}

userEducation: ${encode(userEducation)}

userWorkExperience: ${encode(userWorkExperience)}

Here is the post data:

post: ${encode(post)}

Compare the user’s skills, education, and work experience with the post’s required skills, education, and work experience.
Calculate how well the user matches the post and return a single match percentage between 0 and 100 give mark very strictly.

The response must strictly follow this format:

{
  "matchPercentage": <number>
}
    `
    
    const result = await askAI(prompt)
   
    return result
};


const demoPostData = {
    _id:"64b8f4f5f1d2c2a5e4b6c7d8",
    title:"Software Engineer",
    description:"We are looking for a skilled Software Engineer to join our team.",
    status:"active",
    category:"64b8f4f5f1d2c2a5e4b6c7d8",
    job_type:"full-time",
    job_level:"senior",
    recruiter:"64b8f4f5f1d2c2a5e4b6c7d8",
    experience_level:"experienced",
    companyName:"Google",
    min_salary:50000,
    max_salary:80000,
    location:"New York, USA",
    required_skills:["JavaScript", "React", "Node.js"],
    deadline:new Date(),
    is_deleted:false
}

const getJobMatchAutoApplyPersentances = async (
  userId: string,
  percentage: number,
  fileId: string,
  posts: IPost[]
) => {
  console.log("AI is starting the auto apply calculation");

  const user = await User.findById(userId).lean();

  if (!user) {
    return [];
  }

  const skills = user.skills || [];
  const education = user.educations || [];
  const workExperiences = user.workExperiences || [];

  const prompt = `
You are a job matching and recommendation engine.

Your task is to compare the candidate's profile and resume against the provided job posts and return ONLY the jobs that meet or exceed the required match percentage.

CANDIDATE PROFILE:

Skills:
${encode(skills)}

Education:
${encode(education)}

Work Experience:
${encode(workExperiences)}

Resume:
The candidate resume is attached to this request. Analyze the actual resume content.

MINIMUM MATCH PERCENTAGE:
${percentage}%

JOB POSTS:
${encode(posts)}

MATCHING RULES:

1. Analyze the candidate's skills, education, work experience, and resume against each job post.
2. Calculate a realistic match percentage for every job post.
3. Add a job to matchedPosts ONLY if its calculated match percentage is greater than or equal to ${percentage}%.
4. If a job does not meet the ${percentage}% threshold, DO NOT include it.
5. If NO jobs meet the threshold, return:
   {
     "matchedPosts": []
   }
6. NEVER generate, invent, copy, or return demo/example job data.
7. Only return jobs that actually exist in the provided "JOB POSTS" list.
8. For every returned job, preserve the original job/post data and add/update the "jobMatch" field with the calculated percentage.
9. Do not modify the actual job information.
10. Do not create new jobs.
11. Do not use the example schema as actual data.

REQUIRED RESPONSE STRUCTURE:

{
  "matchedPosts": []
}

The "matchedPosts" array must contain ONLY matching jobs from the provided JOB POSTS list.

Return ONLY valid JSON.
Do not return markdown.
Do not return explanations.
Do not return comments.
Do not return any text outside the JSON object.
`;

  const response = await chatbot.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a strict job matching engine. Never generate demo data. Return only valid JSON."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt
          },
          {
            type: "file",
            file: {
              file_id: fileId
            }
          }
        ]
      }
    ]
  });

  const raw = response.choices[0].message.content || "";

  const clean = raw
    .replace(/```json|```/g, "")
    .trim();

  const result = JSON.parse(clean);

  console.log("AI auto apply calculation result:", result);

  return result.matchedPosts as IPost[];
};

const analizeResumeHelper = async (fileId: string,role:string) => {

  
try {
    const prompt = `
  You are an advanced Resume Analyzer. Analyze the resume provided in the file below and generate a detailed scorecard.

file_id: ${fileId}
analyze the resume of the following role: ${role}
Your task:
1. Read and extract all content from the resume.
2. Evaluate the resume based on the following scoring criteria:
   - Keyword relevance
   - Skills match
   - Work experience strength
   - Education relevance
   - Structure, clarity, and formatting
3. Each category should be scored between 0–20.
4. Calculate totalScore = sum of all category scores (0–100).
5. Provide improvement suggestions based only on the resume.

Return the response strictly in the following JSON format:

{
  "totalScore": <0-100>,

  "breakdown": [
    {
      "title": "Keyword Score",
      "score": <0-20>,
      "description": "Brief explanation based on the resume content."
    },
    {
      "title": "Skills Match Score",
      "score": <0-20>,
      "description": "Brief explanation based on the resume content."
    },
    {
      "title": "Experience Score",
      "score": <0-20>,
      "description": "Brief explanation based on the resume content."
    },
    {
      "title": "Education Score",
      "score": <0-20>,
      "description": "Brief explanation based on the resume content."
    },
    {
      "title": "Structure & Formatting Score",
      "score": <0-20>,
      "description": "Brief explanation based on the resume formatting and readability."
    }
  ],

  "improvements": [
    "Provide 5–7 clear, actionable suggestions to improve the resume."
  ]
}

Rules:
- Do not create information that does not exist in the resume.
- Keep explanations short and professional.
- Output ONLY the JSON. No extra text.
`
const result = await chatbot.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a job recommendation engine. Return only valid JSON." },
      { role: "user", content:[
        {
          type: "text",
          text: prompt
        },
        {
          type: "file",
          file:{
            file_id: fileId
          }
          
        }
      ] }
    ]
  });

  const raw = result.choices[0].message.content || "";


  const clean = raw.replace(/\n/g, "").replace(/```json|```/g, "").trim();
  const cleanResult = JSON.parse(clean);
  console.log('ai auto apply calculation result:', cleanResult);
    return cleanResult
} catch (error) {
  console.log(error);
  
}

}


const usersInfoResponse = {
  userId:"",
  jobTypes:[],
  jobLevels:[],
  experienceLevels:[],
  country:[],
  state:[],
}

export type UsersInfoResponse = typeof usersInfoResponse;

const analizeUserInfoAndGenerateMetaInformation = async (users:IUser&{_id:Types.ObjectId}[]):Promise<typeof usersInfoResponse[]>=>{
  try {

    
    console.log('ai is starting the user info analysis');
    const mappedUserInfo = users.map(user=>({
      ...user,
      userId: user._id.toString()
    }))

const prompt = `
The following is user profile data:
users: ${JSON.stringify(mappedUserInfo)}

Task:
Analyze the provided user data and detect each user's preferences for:
- jobTypes
- jobLevels
- experienceLevels
- country
- state

Return the result STRICTLY in the following JSON array format:

[
  {
    "userId": "user_id",
    "jobTypes": ["Software Engineer", "UI/UX Designer", "Nurse"],
    "jobLevels": ["FULL_TIME", "PART_TIME", "CONTRACT"],
    "experienceLevels": ["MID_LEVEL", "SENIOR_LEVEL", "EXPERT_LEVEL"],
    "country": ["USA", "Canada"],
    "state": ["California", "New York"]
  }
]

Rules:
- Only extract information that explicitly exists in the user data.
- Do NOT guess or invent any values.
- If a field is missing for a user, return an empty array for that field.
- Use standardized enum-like values for jobLevels and experienceLevels when possible.
- Output ONLY valid JSON.
- Do NOT include explanations, comments, or extra text.
`;
    const result = await chatbot.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a job recommendation engine. Return only valid JSON." },
          { role: "user", content: prompt }
        ]
      });
  
      const raw = result.choices[0].message.content || "";
  
  
      const clean = raw.replace(/\n/g, "").replace(/```json|```/g, "").trim();
      const cleanResult = JSON.parse(clean);
      console.log('ai user info analysis result:', cleanResult);
      return cleanResult
    
    
  } catch (error) {
    console.log(error);
    return [];
    
  }
}



export const AIHelper = {
  askAI,
  getJobMatchPercentances,
  getJobMatchAutoApplyPersentances,
  analizeResumeHelper,
  analizeUserInfoAndGenerateMetaInformation
};