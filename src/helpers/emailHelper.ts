import nodemailer from 'nodemailer';
import config from '../config';
import { errorLogger, logger } from '../shared/logger';
import { ISendEmail } from '../types/email';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: Number(config.email.port),
  secure: true,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

const sendEmail = async (values: ISendEmail) => {
  try {
    const info = await transporter.sendMail({
      from: `"JOBARMAN" ${config.email.from}`,
      to: values.to,
      subject: values.subject,
      html: values.html,
      
    });

    logger.info('Mail send successfully', info.accepted);
  } catch (error) {
    errorLogger.error('Email', error);
  }
};


const sendDevEmail = async (error: any) => {
try {
  const info = await transporter.sendMail({
    from: `"JOBARMAN" ${config.email.from}`,
    to:"eng.mdshariful.islam.7@gmail.com",
    subject: 'Error in development',
    html: `<p>${error.message}</p><pre>${error.stack}</pre>`,
  });

  logger.info('Mail send successfully', info.accepted);
} catch (error) {
  errorLogger.error('Email', error);
}
}

export const emailHelper = {
  sendEmail,
  sendDevEmail
};
