import mongoose from "mongoose";
import Stripe from "stripe";
import { Spotlight } from "../app/modules/spotlight/spotlight.model";
import { sendNotifications, sendNotificationsAdmin } from "../helpers/notificationsHelper";

export const handleSpotlightCheckout = async (payload: Stripe.Checkout.Session): Promise<void> => {
    const mongoSession = await mongoose.startSession();
    try {
        mongoSession.startTransaction();
        const spotlightId = payload.metadata?.spotlightId;
        await Spotlight.findByIdAndUpdate(spotlightId, { isPaid: true }, { session: mongoSession });
        await sendNotifications({
            title: `Spotlight Payment Successful!`,
            message: `Your payment for the spotlight has been successfully processed. Admin will review and approve your spotlight shortly.`,
            isRead: false,
            filePath: "spotlight",
            referenceId: new mongoose.Types.ObjectId(spotlightId),
            receiver: [new mongoose.Types.ObjectId(payload.metadata?.userId)]
        })

        await sendNotificationsAdmin({
            title: `New Spotlight Awaiting Approval`,
            message: `A new spotlight has been paid for and is awaiting your approval.`,
            isRead: false,
            filePath: "spotlight",
            referenceId: new mongoose.Types.ObjectId(spotlightId),
        })
        await mongoSession.commitTransaction();
        mongoSession.endSession();
    } catch (error) {
        await mongoSession.abortTransaction();
        mongoSession.endSession();
        console.log(error);
    }
}