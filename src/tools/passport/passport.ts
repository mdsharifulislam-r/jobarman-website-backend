import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import config from '../../config';
import { User } from '../../app/modules/user/user.model';
import ApiError from '../../errors/ApiError';

class PassportHelper {
    constructor() {}

    googleStrategy() {
        passport.use(
            new GoogleStrategy(
                {
                    clientID: config.google.client_id!,
                    clientSecret: config.google.client_secret!,
                    callbackURL: process.env.GOOGLE_REDIRECT_URL!,
                    passReqToCallback: true, // optional if you need the request in verify
                    scope: ['email', 'profile'],
                },
                // Verify function
                async(request: any, accessToken:string, refreshToken:string, profile:any, done:any) => {
                    let user = await User.findOne({email:profile.emails[0].value});
                    if(!user){
                        user = await User.create({
                            email:profile.emails[0].value,
                            name:profile.displayName,
                            password:profile.id,
                            isSocialLogin:true,
                            verified:true,
                            role:request.query.state
                        });
                    }
                    return done(null, user);
                }
            )
        );
    }

    linkedInStrategy() {
        passport.use(
            new LinkedInStrategy(
                {
                    clientID: config.linkeden.client_id!,
                    clientSecret: config.linkeden.client_secret!,
                    callbackURL: config.linkeden.redirect_url!,
                    scope: ["profile", "email"],
                    state: true,
                    passReqToCallback: true
                } as any,
                async (request: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
                    console.log(request);
                    done(null, profile);
                }
            )
        )
    }

    

    // Middleware to initialize passport in Express
    initialize() {
        return [passport.initialize(), passport.session()];
    }

    // Optional: serialize & deserialize user
    serialize() {
        passport.serializeUser((user: any, done) => done(null, user));
        passport.deserializeUser((user: any, done) => done(null, user));
    }

     passport = passport;
}



const passportHelper = new PassportHelper();

passportHelper.googleStrategy();
passportHelper.linkedInStrategy();
passportHelper.serialize();
export default passportHelper;
