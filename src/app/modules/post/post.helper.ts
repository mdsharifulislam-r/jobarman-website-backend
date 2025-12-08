import { JwtPayload } from "jsonwebtoken";
import { Post } from "./post.model";
import { Favourite } from "../favourite/favourite.model";
import { Application } from "../application/application.model";

function getStartDateFromFilter(filter: string): string {
  const now = new Date();

  switch (filter.toLowerCase()) {
    case "all":
      return new Date(0).toISOString(); // Start of time

    case "last hour":
      return new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();

    case "last 24 hours":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    case "last 7 days":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    case "last 30 days":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    default:
      throw new Error("Invalid filter option");
  }
}


const getDataByRange = async (
  user: JwtPayload,
  initialQuery: Record<string, any>,
  query: Record<string, any>
) => {

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const lat = Number(query.lat);
  const lng = Number(query.lng);
  const radiusKm = Number(query.radius); // radius must be in kilometers
 
  
  if (!isNaN(lat) && !isNaN(lng) && radiusKm > 0) {
    const radiusInRadians = radiusKm / 6378.1;

    initialQuery.gioLocation = {
      $geoWithin: {
        $centerSphere: [[lng, lat], radiusInRadians],
      },
    };
  }

  const total = await Post.countDocuments(initialQuery);

  const posts = await Post.find(initialQuery)
    .populate("recruiter", "name email image")
    .populate("category", "name")
    .skip(skip)
    .limit(limit);

  const postIds = posts.map((p) => p._id);

  const favourites = await Favourite.find({
    user: user.id,
    post: { $in: postIds },
  }).lean();

  const applications = await Application.find({
    user: user.id,
    post: { $in: postIds },
  }).lean();

  const favSet = new Set(favourites.map((x) => x.post.toString()));
  const appSet = new Set(applications.map((x) => x.post.toString()));

  const data = posts.map((post) => ({
    ...post.toObject(),
    is_favorite: favSet.has(post._id.toString()),
    is_applied: appSet.has(post._id.toString()),
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
};


export const PostHelper = { getStartDateFromFilter,getDataByRange };