import { Types } from "mongoose";
import { IPost } from "../app/modules/post/post.interface";
import { Post } from "../app/modules/post/post.model";
import { IUser } from "../app/modules/user/user.interface";
import { User } from "../app/modules/user/user.model";
import { chatbot } from "../config/open-ai.config";
import { encode } from "@toon-format/toon";
const askAI = async (prompt: string) => {
  const completion = await chatbot.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a job recommendation engine. Return only valid JSON." },
      { role: "user", content: prompt }
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

const getJobMatchAutoApplyPersentances = async (userId:string,percentage:number,fileId:string,posts:IPost[]) => {
  console.log('ai is starting the auto apply calculation');
    const user = await User.findById(userId)?.lean();
    if(!user){
        return [];
    }

    const skills = user.skills || [];
    const education = user.educations || [];
    const workExperiences = user.workExperiences || [];

    const prompt = `
Here is the user profile data:

userSkills: ${encode(skills)}
userEducation: ${encode(education)}
userWorkExperience: ${encode(workExperiences)}
fileId: ${fileId}
percentage: ${percentage}

Here is the list of posts:
posts: ${encode(posts)}

Compare the user’s skills, education, and work experience with each post’s required skills, education, and work experience. Determine which posts the user matches with at least the given percentage or higher. Return only the list of matched posts.
and calculate how well the user matches each post and give the match percentage in jobMatch field.
dont generate any demo data.
The response must strictly follow this format :
${JSON.stringify({
  matchedPosts: [
    demoPostData
  ]
})}

    `
  const response = await chatbot.chat.completions.create({
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

  const raw = response.choices[0].message.content || "";

  const clean = raw.replace(/\n/g, "").replace(/```json|```/g, "").trim();
  const result = JSON.parse(clean);
  console.log('ai auto apply calculation result:', result);
    return result.matchedPosts as IPost[]
}

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