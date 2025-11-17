import mongoose from "mongoose";
import Stripe from "stripe";


import stripe from "../config/stripe";
import { Package } from "../app/modules/package/package.model";
import { User } from "../app/modules/user/user.model";
import { Subscription } from "../app/modules/subscription/subscription.model";
import { RedisHelper } from "../tools/redis/redis.helper";


export const handleSubscriptionCreated = async (event: Stripe.Subscription) => {
    const mongooseSession = await mongoose.startSession();
    try {
        mongooseSession.startTransaction();
        // console.log(event);
        
        const subscription = await stripe.subscriptions.retrieve(event.id);
        console.log(subscription);
        
        if(!subscription){
            console.log("subscription not found");
            return
        }
        // console.log(subscription);
        

        const price_id = subscription?.items?.data[0]?.price.id;
        if(!price_id){
            console.log("price_id not found");
            return
        }
        const packageData = await Package.findOne({priceId:price_id}).lean();
        if(!packageData){
            console.log("package not found");
            return
        }
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if(!customer){
            console.log("customer not found");
            return
        }

        
        

        const user = await User.findOne({email: (customer as any).email}).lean()

        if(!user){
            console.log("user not found");
            return
        }

        const existingSubscription = await Subscription.findById(user.subscription)
        if(existingSubscription){

            await Subscription.findByIdAndUpdate(user.subscription,{status:"inactive"},{session:mongooseSession})
        }

        const startDate = new Date(subscription.start_date * 1000)
        const endDate = packageData.recurring == "month"? new Date(new Date().setMonth(new Date().getMonth() + 1)):new Date(new Date().setFullYear(new Date().getFullYear() + 1))

        const newSubscription = await Subscription.create({
            subscriptionId: event.id,
            status: "active",
            user: user._id,
            package: packageData._id,
            startDate:startDate,
            endDate:endDate,
            price:packageData.price,
            txId:subscription.id,
            name:packageData.name
        })




        await User.findByIdAndUpdate(user._id,{subscription:newSubscription._id},{session:mongooseSession})


        await mongooseSession.commitTransaction()
        await mongooseSession.endSession()

        console.log("subscription Successfull");
        await RedisHelper.HKeyDelete(`user:${user._id}:transactions`);
        
    
        
    } catch (error) {
        await mongooseSession.abortTransaction()
        await mongooseSession.endSession()
        console.log(error);
        
        
    }
    
}