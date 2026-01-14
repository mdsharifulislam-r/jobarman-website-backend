import { JwtPayload } from 'jsonwebtoken';
import { sendNotifications, sendNotificationsAdmin } from '../../../helpers/notificationsHelper';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { ISpotlight, SpotlightModel } from './spotlight.interface';
import { Spotlight } from './spotlight.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { USER_ROLES } from '../../../enums/user';
import stripe from '../../../config/stripe';
import { SpotlightPrice } from '../admin/admin.model';
import ApiError from '../../../errors/ApiError';
import { User } from '../user/user.model';
import config from '../../../config';

const createSpotlight = async (data: ISpotlight) => {
    const spotlight = await Spotlight.create(data);
    const userInfo = await User.findById(data.user).lean();
    const letestPrice = await SpotlightPrice.findOne({status:'active'}).sort({_id:-1}).lean();
    if(!letestPrice){
        throw new ApiError(400,'Spotlight price not set by admin');
    }
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `Payment for Spotlight focusing on ${data.focus_area}`,
                        description: `Without payment, your spotlight will remain in 'pending' status and won't be visible to users.`,
                    },
                    unit_amount: letestPrice.price * 100,
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: `${config.urls.frontend_url}/career-spotlight`,
        cancel_url: `${config.urls.frontend_url}/career-spotlight`,
        customer_email: userInfo?.email || undefined,
        metadata: {
            spotlightId: spotlight._id.toString(),
            userId: data.user.toString()
        }

});
  if(!session.url){
    throw new ApiError(400,'Failed to create payment session');
  }

  return session.url
}

const updateSpotlight = async (id: string, data: Partial<ISpotlight>) => {
    const spotlight = await Spotlight.findByIdAndUpdate(id, data, { new: true });
    return spotlight;
}
const deleteSpotlight = async (id: string) => {
    await Spotlight.findByIdAndDelete(id);
    return;
}

const approveSpotlight = async (id: string, status: 'approved' | 'rejected') => {
    const spotlight = await Spotlight.findByIdAndUpdate(id, { status }, { new: true });
    if (status === 'approved') {
        await sendNotifications({
            title: `Your Spotlight has been Approved!`,
            message: `Congratulations! Your spotlight on ${spotlight?.focus_area} has been approved and is now live on our platform.`,
            isRead: false,
            filePath: "spotlight",
            referenceId: spotlight?._id,
            receiver: [spotlight!.user]
        })
    }
    else {
        await sendNotifications({
            title: `Your Spotlight has been Rejected`,
            message: `We regret to inform you that your spotlight on ${spotlight?.focus_area} has been rejected. Please review our guidelines and consider resubmitting.`,
            isRead: false,
            filePath: "spotlight",
            referenceId: spotlight?._id,
            receiver: [spotlight!.user]
        })
    }
    return spotlight;
}


const getSpotlightsFromDB = async (query: Record<string, any>,user:JwtPayload) => {
    if([USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN].includes(user?.role)){
        const spotlightQuery = new QueryBuilder(Spotlight.find({isPaid:true}),query).paginate().sort().filter(['downloadType'])

        const [spotlights,pagination] = await Promise.all([
            spotlightQuery.modelQuery.lean(),
            spotlightQuery.getPaginationInfo()
        ])
        return {
            pagination,
            spotlights
        }
    }
    if(user?.role === USER_ROLES.RECRUITER){
        const pendingSpotlights = await Spotlight.countDocuments({ status: 'pending', user: user.id, isPaid:true });
        const totalSpotlights = await Spotlight.countDocuments({ user: user.id, isPaid:true });
        const activeSpotlights = await Spotlight.countDocuments({ status: 'approved', user: user.id, isPaid:true });
        const spotlightQuery = new QueryBuilder(Spotlight.find({user:user.id,isPaid:true}),query).paginate().sort().filter(['downloadType'])

        const [spotlights,pagination] = await Promise.all([
            spotlightQuery.modelQuery.lean(),
            spotlightQuery.getPaginationInfo()
        ])
        return {
            pagination,
            spotlights,
            stats:{
                pendingSpotlights,
                totalSpotlights,
                activeSpotlights
            }
        }
    }
    if(user?.role == USER_ROLES.EMPLOYEE || !user?.role){
        const spotlightQuery = new QueryBuilder(Spotlight.find({status:'approved',isPaid:true}),query).paginate().sort()

        const [spotlights,pagination] = await Promise.all([
            spotlightQuery.modelQuery.lean(),
            spotlightQuery.getPaginationInfo()
        ])
        return {
            pagination,
            spotlights
        }
    }
    
}

export const SpotlightServices = { createSpotlight, updateSpotlight, deleteSpotlight, approveSpotlight, getSpotlightsFromDB };
