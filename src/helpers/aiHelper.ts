import { Post } from "../app/modules/post/post.model";
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

export const AIHelper = {
  askAI,
  getJobMatchPercentances
};