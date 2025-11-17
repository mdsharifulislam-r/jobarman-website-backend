import { Types } from "mongoose";
import { IPackage } from "./package.interface";
import { Package } from "./package.model";
import stripe from "../../../config/stripe";

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
    const result = await Package.find(type?{for:type,status:{$ne:'delete'}}:{status:{$ne:'delete'}})
    return result
}

const updatePackageToDB = async (id:Types.ObjectId,payload:Partial<IPackage>)=>{
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