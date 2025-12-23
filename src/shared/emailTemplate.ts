import { IPost } from '../app/modules/post/post.interface';
import { ICreateAccount, IResetPassword } from '../types/emailTamplate';

const createAccount = (values: ICreateAccount) => {
  const data = {
    to: values.email,
    subject: 'Verify your account',
    html: `<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:30px 15px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#123499; padding:24px; text-align:center;">
              <img
                src="https://res.cloudinary.com/dkbcx9amc/image/upload/v1766479420/Profile_imges-01_1_dvcjmi.png"
                alt="Company Logo"
                style="display:block;margin:0 auto 10px auto;max-height:50px;"
              />
              <h2 style="margin:0; color:#ffffff; font-size:20px;">
                Account Verification
              </h2>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px; color:#333333;">
              <p style="margin-top:0; font-size:14px;">
                Hi ${values.name},
              </p>

              <p style="font-size:14px;">
                To verify your account, please use the One-Time Password (OTP) below:
              </p>

              <!-- OTP Box -->
              <div style="margin:24px 0; text-align:center;">
                <span style="
                  display:inline-block;
                  background:#FF8F27;
                  color:#ffffff;
                  padding:14px 28px;
                  font-size:24px;
                  font-weight:bold;
                  letter-spacing:4px;
                  border-radius:8px;
                ">
                  ${values.otp}
                </span>
              </div>

              <p style="font-size:13px; color:#555;">
                This OTP is valid for <strong>10 minutes</strong>.  
                Please do not share this code with anyone.
              </p>

              <p style="font-size:13px; color:#555;">
                If you did not request this verification, you can safely ignore this email.
              </p>

              <p style="margin-bottom:0; font-size:14px;">
                Regards,<br />
                <strong>JOBARMAN Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; padding:16px; text-align:center; font-size:12px; color:#777;">
              © ${new Date().getFullYear()} JOBARMAN. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>`,
  };
  return data;
};

const resetPassword = (values: IResetPassword) => {
  const data = {
    to: values.email,
    subject: 'Reset your password',
    html: `<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:30px 15px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#123499; padding:24px; text-align:center;">
              <img
                src="https://res.cloudinary.com/dkbcx9amc/image/upload/v1766479420/Profile_imges-01_1_dvcjmi.png"
                alt="Company Logo"
                style="max-height:50px; margin-bottom:10px;"
              />
              <h2 style="margin:0; color:#ffffff; font-size:20px;">
                Reset Your Password
              </h2>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px; color:#333333;">

              <p style="font-size:14px;">
                We received a request to reset your account password.  
                Please use the One-Time Password (OTP) below to proceed:
              </p>

              <!-- OTP Box -->
              <div style="margin:24px 0; text-align:center;">
                <span style="
                  display:inline-block;
                  background:#FF8F27;
                  color:#ffffff;
                  padding:14px 28px;
                  font-size:24px;
                  font-weight:bold;
                  letter-spacing:4px;
                  border-radius:8px;
                ">
                  ${values.otp}
                </span>
              </div>

              <p style="font-size:13px; color:#555;">
                This OTP is valid for <strong>10 minutes</strong>.  
                Do not share this code with anyone for security reasons.
              </p>

              <p style="font-size:13px; color:#555;">
                If you did not request a password reset, please ignore this email or contact our support team immediately.
              </p>

              <p style="margin-bottom:0; font-size:14px;">
                Regards,<br />
                <strong>JOBARMAN Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; padding:16px; text-align:center; font-size:12px; color:#777;">
              © ${new Date().getFullYear()} JOBARMAN. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>`,
  };
  return data;
};

const jobMatchEmailTemplate = (values: {
  userName: string;
  email: string;
  jobs: IPost[];
  isPremiumUser?: boolean;
}) => {
  const mapJobs = values.jobs.map(
    job => `
      <tr>
        <td style="padding:14px 0; border-bottom:1px solid #e5e7eb;">
          <p style="margin:0; font-size:14px; color:#111827; font-weight:600;">
            ${job.title} ${job?.job_board ? `(${job?.job_board||'JOBARMAN'})` : 'JOBARMAN'}
          </p>
          <a 
            href="${job?.job_url||`https://jobarman.com/posts/${(job as any)._id}`}" 
            style="display:inline-block; margin-top:6px; font-size:13px; color:#FF8F27; text-decoration:none; font-weight:600;"
          >
            View job
          </a>
        </td>
      </tr>
    `
  );

  return {
    to: values.email,
    subject: 'New Job Matches Just for You | JOBARMAN',
    html: values.isPremiumUser
      ? `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>JOBARMAN Job Matches</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:30px 15px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#123499; padding:24px; text-align:center;">
              <img 
                src="https://res.cloudinary.com/dkbcx9amc/image/upload/v1766479420/Profile_imges-01_1_dvcjmi.png" 
                alt="JOBARMAN Logo" 
                style="max-height:45px; margin-bottom:10px;"
              />
              <h2 style="margin:0; color:#ffffff; font-size:20px;">
                JOBARMAN
              </h2>
              <p style="margin:6px 0 0; color:#dbeafe; font-size:13px;">
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
                We’ve found some job opportunities that match your profile and preferences.
              </p>

              <!-- Job List -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                ${mapJobs.join('')}
              </table>

              <!-- Profile Tip -->
              <div style="margin-top:22px; padding:14px; background:#fff7ed; border:1px solid #fed7aa; border-radius:6px;">
                <p style="margin:0; font-size:13px; color:#9a3412;">
                  💡 Want better results?  
                  Complete your profile information to receive more accurate and relevant job matches.
                </p>
              </div>

              <p style="margin-top:20px; font-size:14px;">
                Visit your JOBARMAN dashboard to explore more opportunities.
              </p>

              <p style="margin-bottom:0; font-size:14px;">
                Regards,<br />
                <strong>JOBARMAN Team</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
      : `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>JOBARMAN Job Matches</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:30px 15px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#123499; padding:24px; text-align:center;">
              <img 
                src="https://your-domain.com/logo.png" 
                alt="JOBARMAN Logo" 
                style="max-height:45px; margin-bottom:10px;"
              />
              <h2 style="margin:0; color:#ffffff; font-size:20px;">
                JOBARMAN
              </h2>
              <p style="margin:6px 0 0; color:#dbeafe; font-size:13px;">
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
                We matched <strong>${values.jobs.length}</strong> new job opportunities based on your profile.
                Upgrade to <strong style="color:#FF8F27;">Premium</strong> to unlock full access and advanced job recommendations.
              </p>

              <!-- Profile Tip -->
              <div style="margin-top:22px; padding:14px; background:#fff7ed; border:1px solid #fed7aa; border-radius:6px;">
                <p style="margin:0; font-size:13px; color:#9a3412;">
                  💡 Want better results?  
                  Complete your profile information to receive more accurate job matches.
                </p>
              </div>

              <p style="margin-top:20px; font-size:14px;">
                Visit your JOBARMAN dashboard to continue your job search.
              </p>

              <p style="margin-bottom:0; font-size:14px;">
                Regards,<br />
                <strong>JOBARMAN Team</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`,
  };
};

export const emailTemplate = {
  createAccount,
  resetPassword,
  jobMatchEmailTemplate,
};
