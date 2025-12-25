import { Subscription } from "./subscription.model";

const isPremiumUser = async (userId: string) => {
    const subscription = await Subscription.findOne({ user: userId, status: 'active' });
    if(!subscription){
        return false
    }
    const isPremium = subscription?.name?.toLowerCase().includes('premium') || subscription?.name?.toLowerCase().includes('pro') || subscription?.name?.toLowerCase().includes('enterprise')|| subscription?.name?.toLowerCase().includes('platinum');
    return isPremium
};


export const subscriptionHelper = {
    isPremiumUser
}