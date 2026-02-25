import { JwtPayload } from 'jsonwebtoken';
import QueryBuilder from '../../builder/QueryBuilder';
import { IReview, ReviewModel } from './review.interface';
import { Review } from './review.model';
import { USER_ROLES } from '../../../enums/user';

const createReviewInDB = async (data: IReview) => {
    return await Review.create(data);
}

const getReviewsFromDB = async (query: Record<string, any>,user:JwtPayload) => {
    const initalQuery = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(
        user?.role
    )?{}:{status:"published"}
    const reviewQuery = new QueryBuilder(Review.find(initalQuery), query).paginate().sort().filter();
    const [reviews, pagination] = await Promise.all([
        reviewQuery.modelQuery.populate('user', 'name email image').lean(),
        reviewQuery.getPaginationInfo()
    ]);

    return {
        data: reviews,
        pagination
    }
}


const changeStatusReview = async (id: string, status: string) => {
    return await Review.findOneAndUpdate({ _id: id }, { status }, { new: true });
}

export const ReviewServices = {
    createReviewInDB,
    getReviewsFromDB,
    changeStatusReview
};
