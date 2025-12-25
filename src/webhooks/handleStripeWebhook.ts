import { Request, Response } from "express";
import stripe from "../config/stripe";
import config from "../config";
import { handlePurchaseCheckout } from "../handlers/handlePurchaseCheckout";
import { handleSubscriptionCreated } from "../handlers/handleSubscriptionCreated";
import Stripe from "stripe";
import { handleSpotlightCheckout } from "../handlers/handleSpotlightCheckout";

export const handleStripeWebhook = async (req: Request, res: Response) => {
    try {
        const sig = req.headers['stripe-signature'];
        let event = await stripe.webhooks.constructEvent(req.body, sig!, config.stripe.webhook_secret!);

        switch (event.type) {
            case "customer.subscription.created":
                await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
                break;
            case "checkout.session.completed":
                const session = event.data.object as Stripe.Checkout.Session;
                if (session.mode === 'payment' && session.metadata?.spotlightId) {
                    await handleSpotlightCheckout(session);
                } else {
                    console.log("method is not defined for this checkout session");
                    
                }
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (error) {
        console.log(error);
        
    }
}