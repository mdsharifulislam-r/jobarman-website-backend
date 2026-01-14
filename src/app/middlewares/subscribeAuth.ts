import { NextFunction, Request, Response } from "express";
import { Subscription } from "../modules/subscription/subscription.model";
import ApiError from "../../errors/ApiError";
import { StatusCodes } from "http-status-codes";

export const subscribeAuth = (roles: ("bronze" | "silver" | "gold")[]=[]) => {
    return async (req:Request, res:Response, next:NextFunction) => {
        if (req.user) {
           const subscription = await Subscription.findOne({ user: (req.user as any).id,status:"active" }).lean()
        //    console.log(subscription);
           
           if (!subscription) {
            next(new ApiError(StatusCodes.BAD_REQUEST, "You have to upgrade your subscription to access this content."));
            return
           }
           
        if(roles.length==0){
          return  next();
        }

        const match = roles.some((role) => subscription.name.toLowerCase().includes(role.toLowerCase()));
        if (match) {
            return next();
        }
        else{
            next(new ApiError(StatusCodes.BAD_REQUEST, "You have to upgrade your subscription to access this content."));
        }
        
        } else {
            res.status(401).json({ message: 'Unauthorized' });
        }
    };
}