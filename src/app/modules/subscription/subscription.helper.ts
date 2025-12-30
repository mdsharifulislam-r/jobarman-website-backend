import { Subscription } from "./subscription.model";

const isPremiumUser = async (userId: string,subscriptionType:"bronze"|"gold"|"silver"="gold") => {
    const subscription = await Subscription.findOne({ user: userId, status: 'active' });
    if(!subscription){
        return false
    }
    if(subscriptionType){
        return subscription.name.toLowerCase().includes(subscriptionType)
    }
    const isPremium = subscription?.name?.toLowerCase().includes('premium') || subscription?.name?.toLowerCase().includes('pro') || subscription?.name?.toLowerCase().includes('enterprise')|| subscription?.name?.toLowerCase().includes('platinum');
    return isPremium
};


export const subscriptionHelper = {
    isPremiumUser
}