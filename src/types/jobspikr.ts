export interface JobPosting {
  latest_expiry_check_date: string;
  logo_url: string;
  company_name: string;
  crawl_timestamp: string;

  job_title: string;
  contact_email: string;

  html_job_description: string;
  job_description: string;

  country: string;
  state: string;
  city: string;

  inferred_city: string;
  inferred_state: string;
  inferred_country: string;
  inferred_iso3_lang_code: string;

  job_type: string;
  job_board: string;

  apply_url: string;
  url: string;

  post_date: string;

  has_expired: boolean;
  is_salary_estimated: boolean;
  duplicate_status: string;
  valid_through: string;
  inferred_company_name: string;
  inferred_company_type: string;
  inferred_company_type_score: number;

  inferred_job_title: string;
  inferred_department_name: string;
  inferred_department_score: number;
  inferred_seniority_level: string;
  inferred_work_mode: string;
  inferred_salary_currency: string;
  inferred_salary_to: number;
  inferred_salary_from: number;
  inferred_salary_time_unit: string;

  inferred_skills: string[];

  uniq_id: string;
  cursor: number;
}

export interface JobspikrResponse {
  status: string;
  job_data: JobPosting[],
  cursor: number,
  next_cursor: number
}