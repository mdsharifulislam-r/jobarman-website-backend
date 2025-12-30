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
            href="${job?.job_url||`https://JOBARMAN.com/posts/${(job as any)._id}`}" 
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



const interviewCancelTemplate = (values: {
  userName: string;
  email: string;
  postTitle: string;
  reseoon: string;
}) => {
  const data = {
    to: values.email,
    subject: 'JOBARMAN - Interview Cancelled',
    html:`<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
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
                style="display:block; margin:0 auto 10px auto; max-height:50px;"
              />
              <h2 style="margin:0; color:#ffffff; font-size:20px;">
                Interview Cancellation Notice
              </h2>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px; color:#333333;">
              <p style="margin-top:0; font-size:14px;">
                Hi ${values.userName},
              </p>

              <p style="font-size:14px;">
                We regret to inform you that your scheduled interview for the position of
                <strong>${values.postTitle}</strong> has been cancelled.
              </p>

              <!-- Info Box -->
              <div style="margin:24px 0; padding:16px; background:#fff7ed; border:1px solid #fed7aa; border-radius:8px;">
                <p style="margin:0; font-size:13px; color:#9a3412;">
                  📌 <strong>Reason:</strong> ${values.reseoon || "Due to unforeseen circumstances."}
                </p>
              </div>

              <p style="font-size:13px; color:#555;">
                We sincerely apologize for any inconvenience this may cause.  
                If the interview is rescheduled, you will be notified immediately.
              </p>

              <p style="font-size:13px; color:#555;">
                You can continue exploring other job opportunities on JOBARMAN that match your profile.
              </p>

              <p style="margin-bottom:0; font-size:14px;">
                Kind regards,<br />
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
}

const jobApplicationRejectedTemplate = (values: {
  userName: string;
  email: string;
  postTitle: string;
  reason?: string;
}) => {
  const data = {
    to: values.email,
    subject: 'JOBARMAN - Job Application Update',
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
                alt="JOBARMAN Logo"
                style="display:block; margin:0 auto 10px auto; max-height:50px;"
              />
              <h2 style="margin:0; color:#ffffff; font-size:20px;">
                Job Application Update
              </h2>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px; color:#333333;">
              <p style="margin-top:0; font-size:14px;">
                Hi ${values.userName},
              </p>

              <p style="font-size:14px;">
                Thank you for your interest in the position of
                <strong>${values.postTitle}</strong>.
              </p>

              <p style="font-size:14px;">
                After careful consideration, we regret to inform you that your application
                has not been selected at this time.
              </p>

              <!-- Info Box -->
              <div style="margin:24px 0; padding:16px; background:#fff7ed; border:1px solid #fed7aa; border-radius:8px;">
                <p style="margin:0; font-size:13px; color:#9a3412;">
                  📌 <strong>Reason:</strong> ${values.reason || "We have decided to move forward with candidates whose experience more closely matches our current needs."}
                </p>
              </div>

              <p style="font-size:13px; color:#555;">
                This decision does not reflect your skills or potential.  
                We encourage you to continue applying for other opportunities on JOBARMAN.
              </p>

              <p style="font-size:13px; color:#555;">
                We appreciate the time and effort you put into your application and wish you every success in your job search.
              </p>

              <p style="margin-bottom:0; font-size:14px;">
                Best wishes,<br />
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

const interviewSelectedTemplate = (values: {
  userName: string;
  email: string;
  postTitle: string;
  interviewDate: string; // e.g. "25 January 2026"
  interviewTime: string; // e.g. "10:30 AM (BST)"
  interviewMode?: string; // Online / Onsite (optional)
  interviewLink?: string; // meeting link (optional)
}) => {
  const data = {
    to: values.email,
    subject: 'JOBARMAN - Interview Invitation',
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
                alt="JOBARMAN Logo"
                style="display:block; margin:0 auto 10px auto; max-height:50px;"
              />
              <h2 style="margin:0; color:#ffffff; font-size:20px;">
                Interview Invitation
              </h2>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px; color:#333333;">
              <p style="margin-top:0; font-size:14px;">
                Hi ${values.userName},
              </p>

              <p style="font-size:14px;">
                Congratulations! 🎉  
                You have been shortlisted for an interview for the position of
                <strong>${values.postTitle}</strong>.
              </p>

              <!-- Info Box -->
              <div style="margin:24px 0; padding:16px; background:#ecfeff; border:1px solid #67e8f9; border-radius:8px;">
                <p style="margin:6px 0; font-size:13px; color:#0f172a;">
                  📅 <strong>Date:</strong> ${values.interviewDate}
                </p>
                <p style="margin:6px 0; font-size:13px; color:#0f172a;">
                  ⏰ <strong>Time:</strong> ${values.interviewTime}
                </p>
                ${
                  values.interviewMode
                    ? `<p style="margin:6px 0; font-size:13px; color:#0f172a;">
                        💼 <strong>Mode:</strong> ${values.interviewMode}
                      </p>`
                    : ''
                }
                ${
                  values.interviewLink
                    ? `<p style="margin:6px 0; font-size:13px; color:#0f172a;">
                        🔗 <strong>Meeting Link:</strong>
                        <a href="${values.interviewLink}" target="_blank">${values.interviewLink}</a>
                      </p>`
                    : ''
                }
              </div>

              <p style="font-size:13px; color:#555;">
                Please make sure you are available at the scheduled time.
                If you have any issues or need to reschedule, kindly contact us as soon as possible.
              </p>

              <p style="font-size:13px; color:#555;">
                We wish you the best of luck and look forward to meeting you.
              </p>

              <p style="margin-bottom:0; font-size:14px;">
                Best regards,<br />
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

const shortlistedApplicationTemplate = (values: {
  userName: string;
  email: string;
  postTitle: string;
  nextStep?: string; // optional custom message
}) => {
  const data = {
    to: values.email,
    subject: 'JOBARMAN - Application Shortlisted',
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
                alt="JOBARMAN Logo"
                style="display:block; margin:0 auto 10px auto; max-height:50px;"
              />
              <h2 style="margin:0; color:#ffffff; font-size:20px;">
                Application Shortlisted
              </h2>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px; color:#333333;">
              <p style="margin-top:0; font-size:14px;">
                Hi ${values.userName},
              </p>

              <p style="font-size:14px;">
                Great news! 🎉  
                Your application for the position of
                <strong>${values.postTitle}</strong> has been shortlisted.
              </p>

              <p style="font-size:13px; color:#555;">
                Our hiring team is currently reviewing shortlisted candidates.
                If you are selected for the next stage, we will contact you with
                further details regarding the interview process.
              </p>

              <!-- Info Box -->
              <div style="margin:24px 0; padding:16px; background:#ecfeff; border:1px solid #67e8f9; border-radius:8px;">
                <p style="margin:0; font-size:13px; color:#0f172a;">
                  📌 <strong>Next Step:</strong> ${values.nextStep || "Interview details will be shared soon."}
                </p>
              </div>

              <p style="font-size:13px; color:#555;">
                Thank you for your interest in JOBARMAN and for taking the time to apply.
                We appreciate your patience during this process.
              </p>

              <p style="margin-bottom:0; font-size:14px;">
                Best regards,<br />
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


const transactionOtpTemplate = (values: {
  userName: string;
  email: string;
  otp: number;
  expiryMinutes?: number;
}) => {
  const data = {
    to: values.email,
    subject: 'JOBARMAN - Transaction Verification Code',
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
                alt="JOBARMAN Logo"
                style="display:block; margin:0 auto 10px auto; max-height:50px;"
              />
              <h2 style="margin:0; color:#ffffff; font-size:20px;">
                Transaction Verification
              </h2>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px; color:#333333; text-align:center;">
              <p style="margin-top:0; font-size:14px; text-align:left;">
                Hi ${values.userName},
              </p>

              <p style="font-size:14px; text-align:left;">
                To securely access your transaction history, please use the
                one-time verification code below.
              </p>

              <!-- OTP Box -->
              <div style="margin:24px auto; padding:18px; background:#f1f5f9; border-radius:10px; width:fit-content;">
                <p style="margin:0; font-size:28px; font-weight:bold; letter-spacing:6px; color:#123499;">
                  ${values.otp}
                </p>
              </div>

              <p style="font-size:13px; color:#555; text-align:left;">
                This code will expire in
                <strong>${values.expiryMinutes || 5} minutes</strong>.
              </p>

              <p style="font-size:13px; color:#b91c1c; text-align:left;">
                ⚠️ Do not share this code with anyone.  
                JOBARMAN will never ask for your OTP.
              </p>

              <p style="margin-bottom:0; font-size:14px; text-align:left;">
                Regards,<br />
                <strong>JOBARMAN Security Team</strong>
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

export const zoomMeetingInviteTemplate = (values: {
  userName: string;
  email: string;
  meetingTitle: string;
  meetingDate: string; // e.g. "25 Dec 2025"
  meetingTime: string; // e.g. "7:00 PM (BST)"
  meetingLink: string;
}) => {
  return {
    to: values.email,
    subject: 'JOBARMAN - Zoom Meeting Invitation',
    html: `
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
                style="display:block; margin:0 auto 10px auto; max-height:50px;"
              />
              <h2 style="margin:0; color:#ffffff; font-size:20px;">
                Zoom Meeting Invitation
              </h2>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px; color:#333333;">
              <p style="font-size:14px;">
                Hi ${values.userName},
              </p>

              <p style="font-size:14px;">
                You have been invited to attend a Zoom meeting via JOBARMAN.
                Please find the meeting details below.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0; background:#f1f5f9; border-radius:10px; padding:16px;">
                <tr>
                  <td style="font-size:14px;">
                    <strong>Meeting:</strong> ${values.meetingTitle}<br />
                    <strong>Date:</strong> ${values.meetingDate}<br />
                    <strong>Time:</strong> ${values.meetingTime}
                  </td>
                </tr>
              </table>

              <div style="text-align:center; margin:24px 0;">
                <a
                  href="${values.meetingLink}"
                  target="_blank"
                  style="background:#123499; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:6px; font-size:14px; display:inline-block;"
                >
                  Join Zoom Meeting
                </a>
              </div>

              <p style="font-size:13px; color:#555;">
                Please make sure to join the meeting on time.
                If you have any issues, feel free to contact us.
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
</body>
    `,
  };
};

export const congratulationsHiredTemplate = (values: {
  userName: string;
  email: string;
  position: string;
  companyName: string;
  startDate?: string;
}) => {
  return {
    to: values.email,
    subject: 'JOBARMAN - Congratulations! You’re Hired 🎉',
    html: `
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:30px 15px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#16a34a; padding:24px; text-align:center;">
              <img
                src="https://res.cloudinary.com/dkbcx9amc/image/upload/v1766479420/Profile_imges-01_1_dvcjmi.png"
                alt="JOBARMAN Logo"
                style="display:block; margin:0 auto 10px auto; max-height:50px;"
              />
              <h2 style="margin:0; color:#ffffff; font-size:20px;">
                Congratulations 🎉
              </h2>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px; color:#333333;">
              <p style="font-size:14px;">
                Hi ${values.userName},
              </p>

              <p style="font-size:14px;">
                We are excited to inform you that you have been successfully
                hired for the position of
                <strong>${values.position}</strong> at
                <strong>${values.companyName}</strong>.
              </p>

              <div style="margin:20px 0; padding:16px; background:#ecfdf5; border-left:4px solid #16a34a; border-radius:6px;">
                <p style="margin:0; font-size:14px;">
                  Welcome aboard! Your skills and experience impressed the team,
                  and we’re confident you’ll do great.
                </p>
              </div>

              ${
                values.startDate
                  ? `<p style="font-size:14px;">
                      <strong>Start Date:</strong> ${values.startDate}
                    </p>`
                  : ''
              }

              <p style="font-size:14px;">
                The employer or our team will contact you soon with next steps
                and onboarding details.
              </p>

              <p style="margin-bottom:0; font-size:14px;">
                Best wishes,<br />
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
</body>
    `,
  };
};

export const applicationRejectedTemplate = (values: {
  userName: string;
  email: string;
  position: string;
  companyName: string;
}) => {
  return {
    to: values.email,
    subject: 'JOBARMAN - Application Update',
    html: `
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:30px 15px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#6b7280; padding:24px; text-align:center;">
              <img
                src="https://res.cloudinary.com/dkbcx9amc/image/upload/v1766479420/Profile_imges-01_1_dvcjmi.png"
                alt="JOBARMAN Logo"
                style="display:block; margin:0 auto 10px auto; max-height:50px;"
              />
              <h2 style="margin:0; color:#ffffff; font-size:20px;">
                Application Status Update
              </h2>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px; color:#333333;">
              <p style="font-size:14px;">
                Hi ${values.userName},
              </p>

              <p style="font-size:14px;">
                Thank you for taking the time to apply for the
                <strong>${values.position}</strong> position at
                <strong>${values.companyName}</strong>.
              </p>

              <p style="font-size:14px;">
                After careful consideration, we regret to inform you that we will
                not be moving forward with your application at this time.
              </p>

              <div style="margin:20px 0; padding:16px; background:#f9fafb; border-left:4px solid #6b7280; border-radius:6px;">
                <p style="margin:0; font-size:14px; color:#555;">
                  This decision does not reflect a lack of ability or potential.
                  We encourage you to continue applying for other opportunities
                  that match your skills and interests.
                </p>
              </div>

              <p style="font-size:14px;">
                We truly appreciate your interest in
                <strong>${values.companyName}</strong> and wish you every success
                in your job search.
              </p>

              <p style="margin-bottom:0; font-size:14px;">
                Kind regards,<br />
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
</body>
    `,
  };
};



export const emailTemplate = {
  createAccount,
  resetPassword,
  jobMatchEmailTemplate,
  interviewCancelTemplate,
  jobApplicationRejectedTemplate,
  interviewSelectedTemplate,
  shortlistedApplicationTemplate,
  transactionOtpTemplate,
  applicationRejectedTemplate,
  zoomMeetingInviteTemplate,
  congratulationsHiredTemplate
};
