import { model, Schema } from "mongoose";
import { ISubscription, SubscriptionModel } from "./subscripton.interface";

const subscriptionSchema = new Schema<ISubscription,SubscriptionModel>({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'expired'],
    default: 'active',
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  txId: {
    type: String,
    required: true,
  },
  package: {
    type: Schema.Types.ObjectId,
    ref: 'Package',
    required: false,
  },
  max_applications_per_month: {
    type: Number,
    default: 10
  },
  max_resume_analyses_per_month: {
    type: Number,
    default: 1
  },
  current_month: {
    type: String,
    default: new Date().toISOString().split('T')[0]
  },
  used_applications_this_month: {
    type: Number,
    default: 0
  },
  is_chat_allowed: {
    type: Boolean,
    default: true
  },
  is_video_call_allowed: {
    type: Boolean,
    default: true
  },
  active_job_post_limit: {
    type: Number,
    default: 0
  },
  max_job_duration: {
    type: Number,
    default:0
  },
  resume_analyses_per_month: {
    type: Number,
    default: 0
  },
  used_job_posts_this_month: {
    type: Number,
    default: 0
  }
},{
    timestamps:true
});

subscriptionSchema.index({user: 1})

subscriptionSchema.pre('save',async function(next){
  if(this.isNew){
    this.current_month = new Date().toISOString().split('T')[0]
  }
  next()
})

export const  Subscription = model<ISubscription, SubscriptionModel>('Subscription', subscriptionSchema);