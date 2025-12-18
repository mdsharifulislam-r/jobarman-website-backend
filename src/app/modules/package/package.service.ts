import { Types } from "mongoose";
import { IPackage } from "./package.interface";
import { Package } from "./package.model";
import stripe from "../../../config/stripe";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";

const createPackageIntoDB = async (data:IPackage)=>{
    const product = await stripe.products.create({
        name: data.name,
        description: data.features.join(', '),
    })

    const price = await stripe.prices.create({
        product: product.id,
        unit_amount: data.price * 100,
        currency: 'usd',
        recurring: {
            interval: data.recurring,
        },
    })

    const payment_link = await stripe.paymentLinks.create({
        line_items: [
            {
                price: price.id,
                quantity: 1,
            },
        ],
    })

    const result = await Package.create({...data,priceId:price.id,payment_link:payment_link.url,product:product.id})
    return result
}

const getAllPackagesFromDB = async (type?:string)=>{
    const result = await Package.find(type?{for:type,status:"active"}:{status:"active"})
    return result
}

const updatePackageToDB = async (id:Types.ObjectId,payload:Partial<IPackage>)=>{
    const plan = await Package.findById(id)
    if(!plan){
        throw new ApiError(StatusCodes.BAD_REQUEST, "Package doesn't exist!");
    }

    if(payload?.price!>=0 &&payload.price!==plan.price){
        const newPrice = await stripe.prices.create({
            product: plan.product,
            unit_amount: payload?.price! * 100,
            currency: 'usd',
            recurring: {
                interval:payload.recurring || plan.recurring,
            },
        })

        await stripe.prices.update(plan.priceId!,{
            active:false
        })

        const payment_link = await stripe.paymentLinks.create({
            line_items: [
                {
                    price: newPrice.id,
                    quantity: 1,
                },
            ],
        })

        payload.priceId = newPrice.id
        payload.payment_link = payment_link.url
    }

    if(payload?.name || payload.features){
        await stripe.products.update(plan.product!,{
            name:payload.name || plan.name,
            description:payload.features?.join(', ') || plan.features.join(', '),
        })
    }
    const result = await Package.findOneAndUpdate({_id:id},payload,{new:true})
    return result
}

const deletePackageFromDB = async (id:Types.ObjectId)=>{
    const result = await Package.findOneAndUpdate({_id:id},{status:'delete'})
    return result
}

export const PackageService = {
    createPackageIntoDB,
    getAllPackagesFromDB,
    updatePackageToDB,
    deletePackageFromDB
}