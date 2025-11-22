import QueryBuilder from '../../builder/QueryBuilder';
import { IReview, ReviewModel } from './review.interface';
import { Review } from './review.model';

const createReviewInDB = async (data: IReview) => {
    return await Review.create(data);
}

const getReviewsFromDB = async (query: Record<string, any>) => {
    const reviewQuery = new QueryBuilder(Review.find(), query).paginate().sort().filter();
    const [reviews, pagination] = await Promise.all([
        reviewQuery.modelQuery.populate('user', 'name email image').lean(),
        reviewQuery.getPaginationInfo()
    ]);

    return {
        data: reviews,
        pagination
    }
}


export const ReviewServices = {
    createReviewInDB,
    getReviewsFromDB
};
