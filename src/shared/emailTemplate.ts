import { IPost } from '../app/modules/post/post.interface';
import { ICreateAccount, IResetPassword } from '../types/emailTamplate';

const createAccount = (values: ICreateAccount) => {
  const data = {
    to: values.email,
    subject: 'Verify your account',
    html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <img src="https://i.postimg.cc/6pgNvKhD/logo.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
          <h2 style="color: #277E16; font-size: 24px; margin-bottom: 20px;">Hey! ${values.name}, Your Toothlens Account Credentials</h2>
        <div style="text-align: center;">
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Your single use code is:</p>
            <div style="background-color: #277E16; width: 80px; padding: 10px; text-align: center; border-radius: 8px; color: #fff; font-size: 25px; letter-spacing: 2px; margin: 20px auto;">${values.otp}</div>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">This code is valid for 3 minutes.</p>
        </div>
    </div>
</body>`,
  };
  return data;
};

const resetPassword = (values: IResetPassword) => {
  const data = {
    to: values.email,
    subject: 'Reset your password',
    html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <img src="https://i.postimg.cc/6pgNvKhD/logo.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
        <div style="text-align: center;">
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Your single use code is:</p>
            <div style="background-color: #277E16; width: 80px; padding: 10px; text-align: center; border-radius: 8px; color: #fff; font-size: 25px; letter-spacing: 2px; margin: 20px auto;">${values.otp}</div>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">This code is valid for 3 minutes.</p>
                <p style="color: #b9b4b4; font-size: 16px; line-height: 1.5; margin-bottom: 20px;text-align:left">If you didn't request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.</p>
        </div>
    </div>
</body>`,
  };
  return data;
};

const jobMatchEmailTemplate = (values: {
  userName: string;
  email: string;
  jobs: IPost[];
  isPremiumUser?: boolean
}) => {
  const mapJobs = values.jobs.map(
    (job) => `
      <tr>
        <td style="padding:12px 0; border-bottom:1px solid #e5e7eb;">
          <p style="margin:0; font-size:14px; color:#111827; font-weight:600;">
            ${job.title} ${job.job_board ? `(${job.job_board})` : ""}
          </p>
          <a 
            href="${job.job_url}" 
            style="display:inline-block; margin-top:6px; font-size:13px; color:#2563eb; text-decoration:underline;"
          >
            View job details
          </a>
        </td>
      </tr>
    `
  );

  return {
    to: values.email,
    subject: "New Job Matches Just for You | JOBARMAN",
    // if the user is premium user then show the they can all jobs else show only see the matched jobs count
    html:values.isPremiumUser? `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>JOBARMAN Job Matches</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:30px 15px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:#0f172a; padding:22px; text-align:center;">
              <img 
                src="https://your-domain.com/logo.png" 
                alt="JOBARMAN Logo" 
                style="max-height:42px; margin-bottom:10px;"
              />
              <h2 style="margin:0; color:#ffffff; font-size:20px;">
                JOBARMAN
              </h2>
              <p style="margin:6px 0 0; color:#c7d2fe; font-size:13px;">
                Smart job matching powered by AI
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:26px; color:#374151;">
              <p style="margin-top:0; font-size:14px;">
                Hi ${values.userName},
              </p>

              <p style="font-size:14px;">
                We’ve found some job opportunities that match your preferences and profile.
              </p>

              <!-- Job List -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                ${mapJobs.join("")}
              </table>

              <!-- Profile Completion Tip -->
              <div style="margin-top:22px; padding:14px; background:#f0f9ff; border:1px solid #bae6fd; border-radius:6px;">
                <p style="margin:0; font-size:13px; color:#0369a1;">
                  💡 Want better job matches?  
                  Complete your profile information (skills, experience, and preferences) to get more accurate and relevant job recommendations.
                </p>
              </div>

              <p style="margin-top:20px; font-size:14px;">
                You can explore more personalized opportunities anytime from your JOBARMAN dashboard.
              </p>

              <p style="margin-bottom:0; font-size:14px;">
                Best wishes,<br />
                <strong>JOBARMAN Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `:`
    <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>JOBARMAN Job Matches</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:30px 15px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:#0f172a; padding:22px; text-align:center;">
              <img 
                src="https://your-domain.com/logo.png" 
                alt="JOBARMAN Logo" 
                style="max-height:42px; margin-bottom:10px;"
              />
              <h2 style="margin:0; color:#ffffff; font-size:20px;">
                JOBARMAN
              </h2>
              <p style="margin:6px 0 0; color:#c7d2fe; font-size:13px;">
                Smart job matching powered by AI
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:26px; color:#374151;">
              <p style="margin-top:0; font-size:14px;">
                Hi ${values.userName},
              </p>

              <p style="font-size:14px;">
              We matched ${values.jobs.length} new job opportunities based on your profile and preferences.
              Please consider upgrading to our Premium plan to unlock full access to all matched jobs and enjoy enhanced features for a better job search experience.
              </p>

              <!-- Profile Completion Tip -->
              <div style="margin-top:22px; padding:14px; background:#f0f9ff; border:1px solid #bae6fd; border-radius:6px;">
                <p style="margin:0; font-size:13px; color:#0369a1;">
                  💡 Want better job matches?  
                  Complete your profile information (skills, experience, and preferences) to get more accurate and relevant job recommendations.
                </p>
              </div>

              <p style="margin-top:20px; font-size:14px;">
                You can explore more personalized opportunities anytime from your JOBARMAN dashboard.
              </p>

              <p style="margin-bottom:0; font-size:14px;">
                Best wishes,<br />
                <strong>JOBARMAN Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  };
};



export const emailTemplate = {
  createAccount,
  resetPassword,
  jobMatchEmailTemplate,
};
