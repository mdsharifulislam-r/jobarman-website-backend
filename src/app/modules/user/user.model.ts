import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { model, Schema } from 'mongoose';
import config from '../../../config';
import { USER_ROLES } from '../../../enums/user';
import ApiError from '../../../errors/ApiError';
import { IEducation, IGallary, IGallaryModal, IResumeAnalysis, IResumeAnalysisModal, IUser, IWorkExperience, UserModal } from './user.interface';

const educationSchema = new Schema<IEducation>({
  degree:String,
  institute:String,
  startDate:Date,
  endDate:Date,
  passingYear:Number,
  grade:String,
})

const workExperienceSchema = new Schema<IWorkExperience>({
  title: String,
  company: String,
  startDate: Date,
  endDate: Date,
  description: String,
  location: String,
  isCurrentJob: Boolean,
})

const userSchema = new Schema<IUser, UserModal>(
  {
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: 0,
      minlength: 8,
    },
    image: {
      type: String,
      default: 'https://i.ibb.co/z5YHLV9/profile.png',
    },
    status: {
      type: String,
      enum: ['active', 'delete'],
      default: 'active',
    },
    verified: {
      type: Boolean,
      default: false,
    },
    isSocialLogin: {
      type: Boolean,
      default: false,
    },
    authentication: {
      type: {
        isResetPassword: {
          type: Boolean,
          default: false,
        },
        oneTimeCode: {
          type: Number,
          default: null,
        },
        expireAt: {
          type: Date,
          default: null,
        },
      },
      select: 0,
    },
    subscription:{
      type:Schema.Types.ObjectId,
      ref:'Subscription'
    },
    bio: {
      type: String,
    },
    cover: {
      type: String,
    },
    about_us: {
      type: String,
    },
    mission: {
      type: String,
    },
    overview: {
      type: {
        total_employees: {
          type: Number,
        },
        company_type: {
          type: String,
        },
        founded: {
          type: Number,
        },
        revenue: {
          type: String,
        },
      },
     
    },
    contactInfo:{
      type:{
        website: {
          type: String,
        },
        address: {
          type: String,
        },
        contact: {
          type: String,
        },
        email: {
          type: String,
        },
      }
    },
    educations:[educationSchema],
    workExperiences:[workExperienceSchema],
    address: {
      type: String,
    },
    phone: {
      type: String,
    },
    date_of_birth: {
      type: Date,
    },
    gender: {
      type: String,
    },
    nationality: {
      type: String,
    },
    language: {
      type: String,
    },
    linkedin: {
      type: String,
    },
    designation : {
      type: String,
    },
    skills: {
      type: [String],
    },
    
  },
  { timestamps: true }
);

//exist user check
userSchema.statics.isExistUserById = async (id: string) => {
  const isExist = await User.findById(id);
  return isExist;
};

userSchema.statics.isExistUserByEmail = async (email: string) => {
  const isExist = await User.findOne({ email });
  return isExist;
};

//is match password
userSchema.statics.isMatchPassword = async (
  password: string,
  hashPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashPassword);
};

//check user
userSchema.pre('save', async function (next) {
  //check user
  const isExist = await User.findOne({ email: this.email });
  if (isExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email already exist!');
  }

  //password hash
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds)
  );
  next();
});


export const User = model<IUser, UserModal>('User', userSchema);

const gallerySchema = new Schema<IGallary, IGallaryModal>({
  image: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
},{timestamps:true});
export const Gallery = model<IGallary, IGallaryModal>('Gallery', gallerySchema);

const resumeAnalysisSchema = new Schema<IResumeAnalysis, IResumeAnalysisModal>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  analysis: {
    type: Schema.Types.Mixed,
    required: false,
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending',
  },
},{timestamps:true});
export const ResumeAnalysis = model<IResumeAnalysis, IResumeAnalysisModal>('ResumeAnalysis', resumeAnalysisSchema);


