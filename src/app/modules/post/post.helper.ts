import { JwtPayload } from "jsonwebtoken";
import { Post } from "./post.model";
import { Favourite } from "../favourite/favourite.model";
import { Application } from "../application/application.model";
import { jobspikrHelper } from "../../../helpers/jobspkrHelper";
import { IQuery } from "../../../helpers/thirdPartyQueryBuilder";
import { kafkaProducer } from "../../../tools/kafka/kafka-producers/kafka.producer";
import { mapHelper } from "../../../helpers/mapHelper";

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
  query: Record<string, any>,
  thirdPartyQuery: IQuery = {},
  category?: string
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
    user: user?.id ,
    post: { $in: postIds },
  }).lean();

  const applications = await Application.find({
    user: user?.id,
    post: { $in: postIds },
  }).lean();

  const favSet = new Set(favourites.map((x) => x.post.toString()));
  const appSet = new Set(applications.map((x) => x.post.toString()));

  const data = posts.map((post) => ({
    ...post.toObject(),
    is_favorite: favSet.has(post._id.toString()),
    is_applied: appSet.has(post._id.toString()),
  }));
  let cursor = 0
  if(data.length < limit) {
    const address = await mapHelper.getCountryAndStateFromLatLong(lat,lng) as {
      country?: string;
      state?: string;
    } | string;
    const locationQuery: IQuery = {
      ...thirdPartyQuery,
      ...(typeof address === 'object' && address.country
        ? { location: [address.country] }
        : {}),
      ...(typeof address === 'object' && address.state
        ? { state: [address.state] }
        : {}),
    };
    const apiData = await fullfillDataUsingTheThirdPartyApis(
      data.length,
      user?.id,
      limit,
      locationQuery,
      query?.cursor ? Number(query.cursor) : undefined,
      category
    );
    data.push(...(apiData?.data || []));
    cursor = apiData?.cursor || 0;
  }
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
      cursor
    },
  };
};


const fullfillDataUsingTheThirdPartyApis = async (existingDataLength:number,userid:string,limit:number=10,query?:IQuery,cursor?:number,category?:string) => {
  const needPosts = Math.max(0, limit - existingDataLength);

  if(needPosts > 0) {
    const apiData = await jobspikrHelper.getJobs({
      ...query,
      limit:needPosts,
      cursor
    },category);
    const jobs = (apiData?.data || []).slice(0, needPosts);
    if (jobs.length) {
      await kafkaProducer.sendMessage("post", {type:"bulk_insert",data:jobs as any});
    }
    return {
      data:jobs as any,
      cursor:apiData.next_cursor
    }
  }
}





export const PostHelper = { getStartDateFromFilter,getDataByRange,fullfillDataUsingTheThirdPartyApis };