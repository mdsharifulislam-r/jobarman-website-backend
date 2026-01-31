import { Schema, Types, model } from 'mongoose';
import { IPost, PostModel } from './post.interface'; 
import { EXPERIENCE_LEVEL, JOB_LEVEL, JOB_TYPE } from '../../../enums/post';
import { getFromGoogleMaps } from '../../../helpers/mapHelper';
import cryptoToken from '../../../util/cryptoToken';

const postSchema = new Schema<IPost, PostModel>({
  thumbnail: { type: String, required: false,default:''},
  recruiter: { type: Schema.Types.ObjectId, ref: 'User', },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  category: { type: Schema.Types.ObjectId, ref: 'Category' },
  job_type: {
    type: String,
    required: true,
  },
  job_level: {
    type: String,
  },
  experience_level: {
    type: String,
  },
  min_salary: { type: Number, default: 0 },
  max_salary: { type: Number, default: 0 },
  location: { type: String, required: true },
  required_skills: { type: [String], required: false },
  deadline: { type: Date,},
  gioLocation: {
    type: {
      type: String,
      enum: ['Point'],
      required: false,
    },
    coordinates: {
      type: [Number],
      required: false,
    },
  },
  is_deleted: {
    type: Boolean,
    default: false,
  },
  responsibilities: { type: [String], required: false },
  benefits: { type: [String], required: false },
  category_string: { type: String, required: false },
  is_third_party_job: { type: Boolean, default: false },
  job_url: { type: String, required: false },
  recruiter_company: { type: String, required: false },
  salary_currency: { type: String, required: false },
  salary_status: { type: String, required: false },
  job_board: { type: String, required: false },
  post_date: { type: Date, required: false },
  prevImage: { type: String, required: false },
  is_repost: { type: Boolean, default: false },
  prevPostId: { type: Types.ObjectId, required: false, ref: 'Post' },
  unique_id: { type: String, required: false,unique: true },
  cursor: { type: Number, default: 0 },
  salary_recurring: { type: String, required: false },
  work_mode: { type: String, required: false },
  company_contact_email: { type: String, required: false },
},{
    timestamps: true
});

postSchema.index({recruiter: 1})
postSchema.index({gioLocation: '2dsphere'})

postSchema.pre('save', async function (next) {
  try {
      const latong = await getFromGoogleMaps(this.location);
      
if(latong?.longitude && latong?.latitude){
  this.gioLocation = {
    type: 'Point',
    coordinates: [latong.longitude, latong.latitude],
  };
}

  if(!this.unique_id){
    this.unique_id = cryptoToken(8)
  }

  
  next();
  } catch (error) {
    next();
  }
})
// postSchema.pre("insertMany", async function (next) {
//   try {
  
//     next();
//   } catch (error) {
//     next();
//   }
// })

export const Post = model<IPost, PostModel>('Post', postSchema);


export const changeTextinCampleCase= (text:string) => {
  if(!text){
    return ''
  }
  
return text.split(' ').join('_').toUpperCase()
}
