export interface IQuery {
  jobtitles?: string[];
  jobTypes?: string[];
  maxSalary?: number;
  minSalary?: number;
  seniority?: string[];
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
  const phrase = (value: string) => `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  const jobtitles = [...new Set((params.jobtitles || []).filter(Boolean))];
  const jobTypes = [...new Set(
    (params.jobTypes || [])
      .filter(Boolean)
      .map(t => t.split("_").join(" ").toLowerCase())
  )];
  const locations = (params.location || []).filter(Boolean);
  const states = (params.state || []).filter(Boolean);
  const skills = (params.skill || []).filter(Boolean);
  const seniority = [...new Set(
    (params.seniority || [])
      .filter(Boolean)
      .map(value => value.split("_").join(" ").toLowerCase())
  )];

  // Job titles
  if (jobtitles.length) {
    must.push({
      query_string: {
        fields: ["job_title", "inferred_job_title"],
        query: jobtitles.map(phrase).join(" OR ")
      }
    });
  }

  // Job types
  if (jobTypes.length) {
    must.push({
      query_string: {
        default_field: "job_type",
        query: jobTypes.map(phrase).join(" OR ")
      }
    });
  }

  if (seniority.length) {
    must.push({
      query_string: {
        default_field: "inferred_seniority_level",
        query: seniority.map(phrase).join(" OR ")
      }
    });
  }

  // Location (country)
  if (locations.length) {
    must.push({
      bool: {
        should: locations.map(country => ({
          query_string: {
            fields: ["inferred_country"],
            query: phrase(country)
          }
        })),
        minimum_should_match: 1
      }
    });
  }

  // Location (state)
  if (states.length) {
    must.push({
      bool: {
        should: states.map(state => ({
          query_string: {
            fields: ["inferred_state"],
            query: phrase(state)
          }
        })),
        minimum_should_match: 1
      }
    });
  }

  // Apply a date restriction only when the caller supplied one.
  if (params.postDate) {
    must.push({
      range: {
        post_date: {
          gte: params.postDate
        }
      }
    });
  }

  // Skills
  if (skills.length) {
    must.push({
      query_string: {
        default_field: "inferred_skills",
        query: skills.map(phrase).join(" OR ")
      }
    });
  }

  if (params.minSalary !== undefined) {
    must.push({
      range: {
        inferred_salary_from: { gte: params.minSalary }
      }
    });
  }

  if (params.maxSalary !== undefined) {
    must.push({
      range: {
        inferred_salary_to: { lte: params.maxSalary }
      }
    });
  }

  must.push({
    term: {
      has_expired: false
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
    size: params.limit ?? 50,
    cursor: params.cursor,
    search_query_json: {
      bool: {
        must,
        must_not
      }
    }
  };

 
}
