import { JwtPayload } from 'jsonwebtoken';
import { sendNotifications, sendNotificationsAdmin } from '../../../helpers/notificationsHelper';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { ISpotlight, SpotlightModel } from './spotlight.interface';
import { Spotlight } from './spotlight.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { USER_ROLES } from '../../../enums/user';

const createSpotlight = async (data: ISpotlight) => {
    const spotlight = await Spotlight.create(data);
    await sendNotificationsAdmin({
        title: `New Spotlight Added: ${spotlight.organization_name}`,
        message: `A new spotlight on ${spotlight.focus_area} has been added by ${spotlight.organization_name}. Check it out!`,
        isRead: false,
        filePath: "spotlight",
        referenceId: spotlight._id,
    })
    
    return spotlight;
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
    if([USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN].includes(user.role)){
        const spotlightQuery = new QueryBuilder(Spotlight.find(),query).paginate().sort().filter()

        const [spotlights,pagination] = await Promise.all([
            spotlightQuery.modelQuery.lean(),
            spotlightQuery.getPaginationInfo()
        ])
        return {
            pagination,
            spotlights
        }
    }
    if(user.role === USER_ROLES.RECRUITER){
        const pendingSpotlights = await Spotlight.countDocuments({ status: 'pending', user: user.id });
        const totalSpotlights = await Spotlight.countDocuments({ user: user.id });
        const spotlightQuery = new QueryBuilder(Spotlight.find(),query).paginate().sort()

        const [spotlights,pagination] = await Promise.all([
            spotlightQuery.modelQuery.lean(),
            spotlightQuery.getPaginationInfo()
        ])
        return {
            pagination,
            spotlights,
            stats:{
                pendingSpotlights,
                totalSpotlights
            }
        }
    }
    
}

export const SpotlightServices = { createSpotlight, updateSpotlight, deleteSpotlight, approveSpotlight, getSpotlightsFromDB };
