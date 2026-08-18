import cors from 'cors';
import express, { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import router from './routes';
import { Morgan } from './shared/morgen';
import rateLimit from "express-rate-limit";
import requestIp from 'request-ip';
import session from "express-session";
import { handleStripeWebhook } from './webhooks/handleStripeWebhook';
import ApiError from './errors/ApiError';
import passportHelper from './tools/passport/passport';
import passport from 'passport';
import dns from "dns"
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    if (!req.clientIp) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Unable to determine client IP!');
    }
    return req.clientIp;
  },
  handler: (req, res, next, options) => {
    throw new ApiError(options?.statusCode, `Rate limit exceeded. Try again in ${options.windowMs / 60000} minutes.`);
  }
});

app.use(session({
  secret: "your_secret_key",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Secure should be true in production with HTTPS
}));
app.use(requestIp.mw());
app.use(limiter);

// app.use(passport.initialize());
// app.use(passport.session());

//morgan
app.use(Morgan.successHandler);
app.use(Morgan.errorHandler);

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook)

//body parser
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//file retrieve
app.use(express.static('uploads'));
app.use(express.static('assets'));

//router
app.use('/api/v1', router);

//live response
app.get('/', (req: Request, res: Response) => {
  const date = new Date(Date.now());
  res.send(
    `<h1 style="text-align:center; color:#173616; font-family:Verdana;">Beep-beep! The server is alive and kicking.</h1>
    <p style="text-align:center; color:#173616; font-family:Verdana;">${date}</p>
    `
  );
});

//global error handle
app.use(globalErrorHandler);

//handle not found route;
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: 'Not found',
    errorMessages: [
      {
        path: req.originalUrl,
        message: "API DOESN'T EXIST",
      },
    ],
  });
});

export default app;
