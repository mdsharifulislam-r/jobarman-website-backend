import ApiError from '../../../errors/ApiError';
import unlinkFile from '../../../shared/unlinkFile';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import { Post } from '../post/post.model';
import { CategoryModel, ICategory } from './category.interface';
import { Category } from './category.model';

const countPostsForCategory = async (id: string, name: string) => {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return Post.countDocuments({
        $or: [
            { category: id },
            { category_string: name },
            { title: { $regex: escapedName, $options: 'i' } },
        ],
    });
};

const createCategoryInDB = async (category: ICategory): Promise<ICategory> => {
    const createCategory = await Category.create(category);
    const jobs = await countPostsForCategory(createCategory._id.toString(), category.name);
    await Category.updateOne({ _id: createCategory._id }, { $set: { _job_count: jobs } });
    await RedisHelper.keyDelete(`all_category:*`);
    const { _job_count, ...result } = createCategory.toObject();
    return result;
}

const getAllCategoryFromDB = async (): Promise<ICategory[]> => {
    const cache = await RedisHelper.redisGet(`all_category`);
    if(cache){
        console.log("from cache");
        return cache
    }
    const categories = await Category.find({ status: 'active' })
        .select('+_job_count')
        .sort({ createdAt: -1 })
        .lean();
    const allCategory = categories.map(category => ({
        _id: category._id,
        name: category.name,
        image: category.image,
        status: category.status,
        createdAt: (category as ICategory & { createdAt?: Date }).createdAt,
        jobs: category._job_count || 0,
    }));
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
    if (updateCategory && payload.name && payload.name !== exist.name) {
        const jobs = await countPostsForCategory(id, payload.name);
        await Category.updateOne({ _id: id }, { $set: { _job_count: jobs } });
    }
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
