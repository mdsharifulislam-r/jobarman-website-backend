import ApiError from '../../../errors/ApiError';
import unlinkFile from '../../../shared/unlinkFile';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import { Post } from '../post/post.model';
import { CategoryModel, ICategory } from './category.interface';
import { Category } from './category.model';
const createCategoryInDB = async (category: ICategory): Promise<ICategory> => {
    const createCategory = await Category.create(category);
    await RedisHelper.keyDelete(`all_category:*`);
    return createCategory;
}

const getAllCategoryFromDB = async (): Promise<ICategory[]> => {
    const cache = await RedisHelper.redisGet(`all_category`);
    if(cache){
        console.log("from cache");
        return cache
    }
    const allCategory = await Category.aggregate([
        {
            $match: {
                status: 'active'
            }
        },
        {
            $lookup: {
                from: 'posts',
                localField: '_id',
                foreignField: 'category',
                as: 'posts'
            }
        },
        {
            $project: {
                name: 1,
                image: 1,
                jobs: { $size: '$posts' },
                status: 1,
                _id: 1,
                createdAt: 1
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ])
    await RedisHelper.redisSet(`all_category`, allCategory,{}, 60 * 60);
    return allCategory;
}

const updateCategoryInDB = async (id: string, payload: ICategory): Promise<ICategory | null> => {
    const exist = await Category.findById(id);
    if (!exist) {
        throw new ApiError(404,'Category not found');
    }
    if(payload.image && exist.image){
        unlinkFile(exist.image);
    }
    const updateCategory = await Category.findOneAndUpdate({ _id: id }, payload, { new: true });
    await RedisHelper.keyDelete(`all_category:*`);
    return updateCategory;
}

const deleteCategoryFromDB = async (id: string): Promise<ICategory | null> => {
    const exist = await Category.findById(id);
    if (!exist) {
        throw new ApiError(404,'Category not found');
    }
    if(exist.image){
        unlinkFile(exist.image);
    }
    const deleteCategory = await Category.findOneAndUpdate({ _id: id }, { status: 'delete' }, { new: true });
    await RedisHelper.keyDelete(`all_category:*`);
    return deleteCategory;
}

export const CategoryServices = {
    createCategoryInDB,
    getAllCategoryFromDB,
    updateCategoryInDB,
    deleteCategoryFromDB
};
