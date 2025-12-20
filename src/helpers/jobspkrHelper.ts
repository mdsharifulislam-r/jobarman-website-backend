import { IPost } from "../app/modules/post/post.interface";
import { changeTextinCampleCase } from "../app/modules/post/post.model";
import config from "../config";
import { EXPERIENCE_LEVEL } from "../enums/post";
import { JobspikrResponse } from "../types/jobspikr";
import { buildElasticQuery, IQuery } from "./thirdPartyQueryBuilder";

class JobspikrHelper{
    private  client_id:string=config.jobspikr.client_id!;
    private client_auth_key:string=config.jobspikr.client_auth_key!;

    private async requestHandler(url:string,method:string,body?:any){
        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'client_id': this.client_id,
                'client_auth_key': this.client_auth_key,
            },
            body: body?JSON.stringify(body):undefined,
        })

        return await res.json();
    }

    async getJobs(query:IQuery,category?:string){
        const data:JobspikrResponse= await this.requestHandler('https://api.jobspikr.com/v2/data','POST',buildElasticQuery(query));
        
        return {
            data:this.convertJobsPickrToLocal(data.job_data,category),
            next_cursor:data.next_cursor
        }
    }

    convertJobsPickrToLocal(data:JobspikrResponse["job_data"],category?:string){
        const mappedData = data.map((job) =>{
            const data ={
                title:job.job_title,
                recruiter_company:job.company_name,
                job_url:job.url,
                deadline:job?.valid_through?new Date(job.valid_through):undefined,
                job_type:changeTextinCampleCase(job.job_type) as any,
                job_level:changeTextinCampleCase(job.inferred_seniority_level) as any,
                location:job.city?`${job.city}, ${job.country}`:`${job.country||''}`,
                description:job.job_description,
                category_string:job.inferred_department_name,
                thumbnail:job.logo_url,
                is_third_party_job:true,
                experience_level:changeTextinCampleCase(job.inferred_seniority_level)=="MID_LEVEL"?EXPERIENCE_LEVEL.ONE_THREE_YRS:changeTextinCampleCase(job.inferred_seniority_level)=="ENTRY_LEVEL"?EXPERIENCE_LEVEL.ZERO_ONE_YRS:changeTextinCampleCase(job.inferred_seniority_level)=="SENIOR_LEVEL"?EXPERIENCE_LEVEL.FIVE_TEN_YRS:EXPERIENCE_LEVEL.ONE_THREE_YRS,
                required_skills:job.inferred_skills,
                job_board:job.job_board,
                unique_id:job.uniq_id,
                post_date:job.post_date,
                work_mode:job?.inferred_work_mode,
                ...(job?.inferred_salary_to?{
                    min_salary:job.inferred_salary_from,
                    max_salary:job.inferred_salary_to,
                    salary_currency:job.inferred_salary_currency||"USD",
                    salary_recurring:job?.inferred_salary_time_unit
                }:{
                    salary_status:"Not Specified"
                }),
                cursor:job.cursor,
                ...(category?{category:category}:{}),

            }

            return data
        } )

        return mappedData
    }

}

export const jobspikrHelper=new JobspikrHelper();