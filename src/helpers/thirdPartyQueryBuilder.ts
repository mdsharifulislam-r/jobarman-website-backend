export interface IQuery {
  jobtitles?: string[];
  jobTypes?: string[];
  maxSalary?: number;
  minSalary?: number;
  postDate?: string;        // expected format: YYYY-MM-DD
  location?: string[];      // multiple countries
  skill?: string[];
  state?: string[];
  limit?: number;
  cursor?: number;
}

export function buildElasticQuery(params: IQuery) {
  const must: any[] = [];
  const must_not: any[] = [];
  // one month before date 
  params.location=["United States"];
  const oneMonthBeforeDate = new Date();
  oneMonthBeforeDate.setMonth(oneMonthBeforeDate.getMonth() - 1);

  // Job titles
  if (params.jobtitles?.length) {
    params.jobtitles= [...new Set(params.jobtitles)];
    must.push({
      query_string: {
        fields: ["job_title", "inferred_job_title"],
        query: params.jobtitles.map(t => `"${t}"`).join(" OR ")
      }
    });
  }

  // Job types
  if (params.jobTypes?.length) {
    params.jobTypes =[...new Set( params.jobTypes.map(t => t.split("_").join(" ").toLowerCase()))];

    must.push({
      query_string: {
        default_field: "job_type",
        query: params.jobTypes.map(t => `"${t}"`).join(" OR ")
      }
    });
  }

  // Location (country)
  if (params.location?.length) {
    must.push({
      bool: {
        should: params.location.map(country => ({
          query_string: {
            fields: ["inferred_country"],
            query: `"${country}"`
          }
        }))
      }
    });
  }

  // Location (state)
  if (params.state?.length) {
    must.push({
      bool: {
        should: params.state.map(state => ({
          query_string: {
            fields: ["inferred_state"],
            query: `"${state}"`
          }
        }))
      }
    });
  }

  // Post date (last X days or exact date)
  if (params?.postDate || oneMonthBeforeDate.toISOString().split("T")[0]) {
    must.push({
      range: {
        post_date: {
          gte: params.postDate || oneMonthBeforeDate.toISOString().split("T")[0]
        }
      }
    });
  }

  // Skills
  if (params.skill?.length) {
    must.push({
      query_string: {
        default_field: "inferred_skills",
        query: params.skill.map(s => `"${s}"`).join(" OR ")
      }
    });
  }

  // Salary range
  if (params.minSalary || params.maxSalary) {
    const salaryRange: any = {};
    if (params.minSalary) salaryRange.gte = params.minSalary;
    if (params.maxSalary) salaryRange.lte = params.maxSalary;

    must.push({
      range: {
        inferred_salary_from: salaryRange
      }
    });
  }

  must_not.push({
    query_string: {
      default_field: "has_expired",
      query: true
    }
  });

  // Static exclusions
  must_not.push(
    {
      query_string: {
        default_field: "job_board",
        query: "company_website"
      }
    },
    {
      query_string: {
        default_field: "company_name",
        query: "Unspecified"
      }
    }
  );

 return {
    format: "json",
    size: params.limit || 50,
    cursor: params.cursor || undefined  ,
    search_query_json: {
      bool: {
        must,
        must_not
      }
    }
  };

 
}
