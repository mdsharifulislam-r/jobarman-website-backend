import nodemailer from 'nodemailer';
import { BrevoClient } from '@getbrevo/brevo';
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

const brevo = new BrevoClient({
  apiKey: config.email.brevo_api_key || '',
});

const sendEmail = async (values: ISendEmail) => {
  try {
    // const info = await transporter.sendMail({
    //   from: `"JOBARMAN" ${config.email.from}`,
    //   to: values.to,
    //   subject: values.subject,
    //   html: values.html,
    // });

    // logger.info('Mail send successfully', info.accepted);
    await sendBrevoEmail(values);
  } catch (error) {
    errorLogger.error('Email', error);
  }
};

const sendDevEmail = async (error: any) => {
  try {
    // const info = await transporter.sendMail({
    //   from: `"JOBARMAN" ${config.email.from}`,
    //   to: "eng.mdshariful.islam.7@gmail.com",
    //   subject: 'Error in development',
    //   html: `<p>${error.message}</p><pre>${error.stack}</pre>`,
    // });

    // logger.info('Mail send successfully', info.accepted);

    await sendBrevoEmail({
      to: "eng.mdshariful.islam.7@gmail.com",
      subject: "Error in development",
      html: `<p>${error.message}</p><pre>${error.stack}</pre>`,
    });

    //sdsd

  } catch (error) {
    errorLogger.error('Email', error);
  }
};

const sendBrevoEmail = async (values: ISendEmail) => {
  try {
    const info = await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: 'JOBARMAN',
        email: config.email.from || 'info@jobarman.com',
      },
      to: [{ email: values.to }],
      subject: values.subject,
      htmlContent: values.html,
    });

    logger.info('Brevo Mail send successfully', info);
  } catch (error) {
    errorLogger.error('Brevo Email', error);
  }
};

export const emailHelper = {
  sendEmail,
  sendDevEmail,
  sendBrevoEmail,
};


