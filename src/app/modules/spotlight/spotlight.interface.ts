import { Model, Types } from 'mongoose';

export type ISpotlight = {
  cover_image: string;
  organization_name: string;
  service_type: string;
  focus_area: string;
  mode: string;
  location: string;
  pricing: string;
  start_date: Date;
  end_date: Date;
  start_time: string;
  end_time: string;
  contact_info: {
    type: string;
    details: string;
  },
  status:"pending" | "approved" | "rejected",
  user:Types.ObjectId
};

export type SpotlightModel = Model<ISpotlight>;
