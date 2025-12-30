import { Schema, model } from 'mongoose';
import { ISpotlight, SpotlightModel } from './spotlight.interface'; 

const spotlightSchema = new Schema<ISpotlight, SpotlightModel>({
  cover_image: { type: String, required: true },
  organization_name: { type: String, required: true },
  service_type: { type: String, required: true },
  focus_area: { type: String, required: true },
  mode: { type: String, required: true },
  location: { type: String, required: true },
  pricing: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  contact_info: {
    type: {
      type: String,
      required: true
    },
    details: {
      type: String,
      required: true
    }
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isPaid: { type: Boolean, default: false },
  price: { type: Number, required: false },
  paymentId: { type: String, required: false },
},{
  timestamps:true
});

export const Spotlight = model<ISpotlight, SpotlightModel>('Spotlight', spotlightSchema);
