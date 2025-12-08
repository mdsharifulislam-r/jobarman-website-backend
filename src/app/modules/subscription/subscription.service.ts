import axios from "axios";
import { ObjectId } from "mongoose";
import config from "../../../config";
import { Subscription } from "../subscription/subscription.model";
import { User } from "../user/user.model";
import { JwtPayload } from "jsonwebtoken";
import { Package } from "../package/package.model";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../builder/QueryBuilder";
import stripe from "../../../config/stripe";
import { RedisHelper } from "../../../tools/redis/redis.helper";
import generateOTP from "../../../util/generateOTP";
import { emailHelper } from "../../../helpers/emailHelper";

export interface AppleReceiptResponse {
  status: number;
  environment: "Sandbox" | "Production";
  receipt: {
    receipt_type: string;
    bundle_id: string;
    in_app: AppleInAppTransaction[];
  };
  latest_receipt_info: AppleInAppTransaction[];
  latest_receipt: string;
}

export interface AppleInAppTransaction {
  quantity?: string;
  product_id: string;
  transaction_id: string;
  original_transaction_id: string;
  purchase_date_ms: string;
  expires_date_ms?: string;
  is_trial_period?: "true" | "false";
  is_in_intro_offer_period?: "true" | "false";
  auto_renew_status?: "0" | "1";
}

const APPLE_PRODUCTION_URL = "https://buy.itunes.apple.com/verifyReceipt";
const APPLE_SANDBOX_URL = "https://sandbox.itunes.apple.com/verifyReceipt";

const verifyAppleReceipt = async (receipt: string, userId: ObjectId) => {
  // 🔹 First try production, if fails then sandbox
  let response;
  try {
    response = await axios.post(APPLE_PRODUCTION_URL, {
      "receipt-data": receipt,
      password: config.apple.password,
      "exclude-old-transactions": true,
    });
  } catch {
    response = await axios.post(APPLE_SANDBOX_URL, {
      "receipt-data": receipt,
      password: config.apple.password,
      "exclude-old-transactions": true,
    });
  }

  const data: AppleReceiptResponse = response.data;

  if (data.status !== 0) {
    throw new Error("Invalid Apple receipt");
  }

  // Get latest transaction
  const latest = data.latest_receipt_info?.[0];
  if (!latest) {
    throw new Error("No transactions found in receipt");
  }

  // Convert expiry date
  const expiresMs = latest.expires_date_ms
    ? Number(latest.expires_date_ms)
    : Date.now();

  // 🔹 Expire existing subscription first
  const existing = await Subscription.findOne({
    user: userId,
    status: "active",
  });

  if (existing) {
    existing.status = "expired";
    await existing.save();
  }

  // 🔹 Create new subscription
  const subscription = await Subscription.create({
    name: "Apple Subscription",
    price: 100, // You may map product_id → price dynamically
    startDate: new Date(),
    endDate: new Date(expiresMs),
    txId: latest.transaction_id,
    user: userId,
    status: "active",
  });

  // 🔹 Update user subscription ref
  await User.findByIdAndUpdate(userId, {
    subscription: subscription._id,
  });

  
  return subscription;
};

const subscribeByStripe = async (packageId: string, user: JwtPayload) => {
  const packageData = await Package.findById(packageId);
  const userExist = await User.findById(user.id);
  if(!userExist){
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }
  if (!packageData) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Package doesn't exist!");
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: packageData.priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `https://example.com/success`,
    cancel_url: `https://example.com/cancel`,
    customer_email: userExist.email,

  });

  return session?.url
}

const demoSubscriptionForTest = async (packageId:string,user:JwtPayload)=>{

  const packageData = await Package.findById(packageId);
  if(!packageData){
    throw new ApiError(StatusCodes.BAD_REQUEST, "Package doesn't exist!");
  }

  const subscription = await Subscription.create({
    name: packageData.name,
    price: packageData.price,
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    txId: "demo",
    user: user.id,
    status: "active",
    package: packageId
  });

  await User.findByIdAndUpdate(user.id, {
    subscription: subscription._id,
  });



  return subscription;
}


const getSubscriptionByUser = async (user: JwtPayload) => {
  const subscription = await Subscription.findOne({ user: user.id,status:"active" }).populate('user','name email image address designation').lean()
  if (!subscription) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Subscription doesn't exist!");
  }
  const remaningDays = Math.floor((subscription.endDate.getTime() - new Date().getTime()) / 1000 / 60 / 60 / 24);
  return {

    ...subscription,
    remainingDays: remaningDays
  };
};

const subscribedUser = async (query:Record<string,any>) => {
  const SubscriptionQuery = new QueryBuilder(Subscription.find({status:"active"}), query).paginate().sort()

  const [subscriptions,pagination] = await Promise.all([
    SubscriptionQuery.modelQuery.populate("user",'name email profile').exec(),
    SubscriptionQuery.getPaginationInfo()
  ])

  return {
    data:subscriptions,
    pagination
  }
}

const transactionOfSubscription = async (user: JwtPayload,password: string,query:Record<string,any>) => {
  const userExist = await User.findById(user.id).select('+password');
  if (!userExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  const match = await User.isMatchPassword(password, userExist.password);

  if (!match) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Password is incorrect!");
  }

  const otp = generateOTP();
  const authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 3 * 60000),
  };
  await User.findOneAndUpdate({ _id: userExist._id }, { $set: { authentication } });

  emailHelper.sendEmail({
    to: userExist.email,
    subject: "Transaction of Subscription",
    html:`Hello ${userExist.name} your transaction otp is ${otp}`,
  })

  return true
}


const subscriptionUsers = async (query:Record<string,any>) => {
  const SubscriptionQuery = new QueryBuilder(Subscription.find(), query).paginate().sort()

  const [subscriptions,pagination] = await Promise.all([
    SubscriptionQuery.modelQuery.populate([
      {
        path: "user",
        select: "name email profile"
      },
      {
        path: "package",
        select: "name price"
      }
    ]).exec(),
    SubscriptionQuery.getPaginationInfo()
  ])

  return {
    data:subscriptions,
    pagination
  }
}

const getSubscriptionDetailsById = async (id:string) => {
  const subscription = await Subscription.findById(id).populate([
    {
      path: "user",
      select: "name email profile  address location"
    },
    {
      path: "package",
      select: "name price"
    }
  ]).lean();
  return subscription;
}

const transactionOfSubscriptionByOtp = async (user: JwtPayload, query:Record<string,any>) => {

  
  const userExist = await User.findById(user.id).select('+authentication');
  if (!userExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }


  

  if (userExist?.authentication?.oneTimeCode !== Number(query.otp)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "You provided wrong otp!");
  }

  const date = new Date();
  if (date > userExist?.authentication?.expireAt) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Otp already expired!");
  }

  await User.findOneAndUpdate({ _id: userExist._id }, { $unset: { authentication: 1 } });
    const SubscriptionQuery = new QueryBuilder(Subscription.find({user:user.id}), query).paginate().sort()

  const [subscriptions,pagination] = await Promise.all([
    SubscriptionQuery.modelQuery.exec(),
    SubscriptionQuery.getPaginationInfo()
  ])

  const data  = {
    data:subscriptions,
    pagination
  }


  return data

}


const renewSubscription = async (user: JwtPayload) => {
  const subscription = await Subscription.findOne({ user: user.id,status:"active" }).lean()
  if (!subscription) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "You have no active subscription! Please subscribe first.");
  }

  const plan = await Package.findById(subscription.package).lean()
  if (!plan) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Package doesn't exist! Please choose another plan.");
  }

  return subscribeByStripe(plan._id.toString(), user);

};

export const SubscriptionService = {
  verifyAppleReceipt,
  getSubscriptionByUser,
  subscribedUser,
  demoSubscriptionForTest,
  subscribeByStripe,
  transactionOfSubscription,
  subscriptionUsers,
  getSubscriptionDetailsById,
  transactionOfSubscriptionByOtp,
  renewSubscription
};
