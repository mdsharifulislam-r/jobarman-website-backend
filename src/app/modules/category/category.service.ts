import ApiError from '../../../errors/ApiError';
import unlinkFile from '../../../shared/unlinkFile';
import { CategoryModel, ICategory } from './category.interface';
import { Category } from './category.model';
const createCategoryInDB = async (category: ICategory): Promise<ICategory> => {
    const createCategory = await Category.create(category);
    return createCategory;
}

const getAllCategoryFromDB = async (): Promise<ICategory[]> => {
    const getAllCategory = await Category.find({status:'active'});
    return getAllCategory;
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
    return deleteCategory;
}

export const CategoryServices = {
    createCategoryInDB,
    getAllCategoryFromDB,
    updateCategoryInDB,
    deleteCategoryFromDB
};
