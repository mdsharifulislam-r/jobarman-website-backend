import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  ip_address: process.env.IP_ADDRESS,
  database_url: process.env.DATABASE_URL,
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  jwt: {
    jwt_secret: process.env.JWT_SECRET,
    jwt_expire_in: process.env.JWT_EXPIRE_IN,
  },
  email: {
    from: process.env.EMAIL_FROM,
    user: process.env.EMAIL_USER,
    port: process.env.EMAIL_PORT,
    host: process.env.EMAIL_HOST,
    pass: process.env.EMAIL_PASS,
  },
  super_admin: {
    email: process.env.SUPER_ADMIN_EMAIL,
    password: process.env.SUPER_ADMIN_PASSWORD,
  },
  stripe: {
    secret_key: process.env.STRIPE_API_SECRET,
    webhook_secret: process.env.WEBHOOK_SECRET,
  },
  apple: {
    password: process.env.APPLE_PASSWORD,
  },
  zoom: {
    account_id: process.env.ZOOM_ACCOUNT_ID,
    client_id: process.env.ZOOM_CLIENT_ID,
    client_secret: process.env.ZOOM_CLIENT_SECRET,
  },
  google: {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_url: process.env.GOOGLE_REDIRECT_URL,
  },
  linkeden: {
    client_id: process.env.LINKEDIN_CLIENT_ID,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET,
    redirect_url: process.env.LINKEDIN_REDIRECT_URL,
  },
  openAi: {
    key: process.env.OPENAI_API_KEY,
  },
  urls:{
    frontend_url:process.env.FRONTEND_URL
  },
  locationQ: {
    key: process.env.LOCATIONIQ_API_KEY,
  },
  jobspikr:{
    client_id:process.env.JOBSPIKR_CLIENT_ID,
    client_auth_key:process.env.JOBSPIKR_CLIENT_AUTH_KEY
  },
  googleMaps: {
    key: process.env.GOOGLE_MAPS_API_KEY,
  },
};
