import { USER_ROLES } from '../../../enums/user';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import { Post } from '../post/post.model';
import { Spotlight } from '../spotlight/spotlight.model';
import { Subscription } from '../subscription/subscription.model';
import { User } from '../user/user.model';

const getSummuryFromDb = async () => {
  const toalJobSeekers = await User.countDocuments({
    role: USER_ROLES.EMPLOYEE,
    verified: true,
    status: 'active',
  });
  const toalRecruiters = await User.countDocuments({
    role: USER_ROLES.RECRUITER,
    verified: true,
    status: 'active',
  });
  const totalActiveJobs = await Post.countDocuments({ status: 'active',is_deleted: false });
  const totalRevinue = await Subscription.aggregate([
    {
      $group: {
        _id: null,
        total: {
          $sum: '$price',
        },
      },
    },
  ]);

  const totalSpotlightsPrice = await Spotlight.aggregate([
    {
      $match: {
        isPaid: true,
        price: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: '$price',
        },
      },
    },
  ]);

  console.log(totalSpotlightsPrice);
  
  const spotlightPrice = totalSpotlightsPrice.length > 0 ? Number(totalSpotlightsPrice[0].total) : 0;
  return {
    toalJobSeekers,
    toalRecruiters,
    totalActiveJobs,
    totalRevinue: totalRevinue.length > 0 ? Number(totalRevinue[0].total+ spotlightPrice).toFixed(2) : 0,
  };
};

function getWeekStartDates() {
  const today = new Date();

  // Get start of this week (Monday)
  const dayOfWeek = today.getDay(); // Sunday = 0, Monday = 1, ...
  const diffToMonday = (dayOfWeek + 6) % 7; // make Monday=0
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - diffToMonday);
  thisWeekStart.setHours(0, 0, 0, 0);

  // Start of next week = thisWeekStart + 7 days
  const nextWeekStart = new Date(thisWeekStart);
  nextWeekStart.setDate(thisWeekStart.getDate() + 7);

  return { thisWeekStart, nextWeekStart };
}

const weeklyReportFromDB = async () => {
  const { thisWeekStart, nextWeekStart } = getWeekStartDates();

  console.log(thisWeekStart, nextWeekStart);

  const totalWeeklyJobSeeker = await User.aggregate([
    {
      $match: {
        role: USER_ROLES.EMPLOYEE,
        verified: true,
        status: 'active',
        createdAt: { $gte: thisWeekStart, $lt: nextWeekStart },
      },
    },
    {
      // daily user report
      $group: {
        _id: {
          $dateToString: {
            format: '%d',
            date: '$createdAt',
          },
        },
        total: {
          $sum: 1,
        },
      },
    },
  ]);

  const totalWeeklyRecruiter = await User.aggregate([
    {
      $match: {
        role: USER_ROLES.RECRUITER,
        verified: true,
        status: 'active',
        createdAt: { $gte: thisWeekStart, $lt: nextWeekStart },
      },
    },
    {
      // daily user report
      $group: {
        _id: {
          $dateToString: {
            format: '%d',
            date: '$createdAt',
          },
        },
        total: {
          $sum: 1,
        },
      },
    },
  ]);

  const totalWeeklyRevinue = await Subscription.aggregate([
    {
      $match: {
        createdAt: { $gte: thisWeekStart, $lt: nextWeekStart },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%d',
            date: '$createdAt',
          },
        },
        total: {
          $sum: '$price',
        },
      },
    },
  ]);

  // let get the day name by date like 24:Mon
  function getDayName(date: Date) {
    const ac_date = new Date(date);
    const dayName = new Date(ac_date).toLocaleString('default', {
      weekday: 'short',
    });
    return dayName;
  }

  let weekStartDate = new Date(thisWeekStart);

  const data = [];

  for (let i = 0; i <= 7; i++) {
    const dayName = getDayName(weekStartDate);

    const totalJobSeeker = totalWeeklyJobSeeker.filter(
      item => item._id === weekStartDate.getDate().toString()
    );
    const totalRecruiter = totalWeeklyRecruiter.filter(
      item => item._id === weekStartDate.getDate().toString()
    );
    const totalRevinue = totalWeeklyRevinue.filter(
      item => item._id === weekStartDate.getDate().toString()
    );

    data.push({
      dayName,
      totalJobSeeker: totalJobSeeker.length > 0 ? totalJobSeeker[0].total : 0,
      totalRecruiter: totalRecruiter.length > 0 ? totalRecruiter[0].total : 0,
      totalRevinue: totalRevinue.length > 0 ? totalRevinue[0].total : 0,
    });
    weekStartDate.setDate(weekStartDate.getDate() + 1);
  }

  return data;
};

const monthlyReportFromDB = async (year: number = new Date().getFullYear()) => {
    const cache = await RedisHelper.redisGet(`monthly_revinue`,{year});
    if(cache){
        console.log("from cache");
        return cache
    }
  const currentYearStartDate = new Date(year, 0, 1);
  const currentYearEndDate = new Date(year, 11, 31);

  const totalMonthlyRevinue = await Subscription.aggregate([
    {
      $match: {
        createdAt: { $gte: currentYearStartDate, $lt: currentYearEndDate },
      },
    },
    {
      $group: {
        _id: {
          $month: '$createdAt',
        },
        total: {
          $sum: '$price',
        },
      },
    },
  ]);

  const months = {
    1: 'Jan',
    2: 'Feb',
    3: 'Mar',
    4: 'Apr',
    5: 'May',
    6: 'Jun',
    7: 'Jul',
    8: 'Aug',
    9: 'Sep',
    10: 'Oct',
    11: 'Nov',
    12: 'Dec',
  } as Record<string, string>;

  const data = [];
  for (let month in months) {
    const totalRevinue = totalMonthlyRevinue.filter(item => item._id == month);
    data.push({
      month: months[month.toString() as keyof typeof months],
      totalRevinue: totalRevinue.length > 0 ? totalRevinue[0].total : 0,
    });
  }

  await RedisHelper.redisSet(`monthly_revinue`, data,{year});

  return data;
};

const manualSearchDetails = async (startDate: string, endDate: string) => {
  if (!startDate) {
    const currentMonthStartDate = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    startDate = currentMonthStartDate.toISOString();
  }

  if (!endDate) {
    const currentMonthEndDate = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0
    );
    endDate = currentMonthEndDate.toISOString();
  }

  const cache = await RedisHelper.redisGet(`manual_search_details`, {
    startDate,
    endDate,
  });
  if (cache) {
    console.log('from cache');

    return cache;
  }

  const totalJobSeeker = await User.aggregate([
    {
      $match: {
        role: USER_ROLES.EMPLOYEE,
        verified: true,
        status: 'active',
        createdAt: { $gte: new Date(startDate), $lt: new Date(endDate) },
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: 1,
        },
      },
    },
  ]);

  const totalRecruiter = await User.aggregate([
    {
      $match: {
        role: USER_ROLES.RECRUITER,
        verified: true,
        status: 'active',
        createdAt: { $gte: new Date(startDate), $lt: new Date(endDate) },
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: 1,
        },
      },
    },
  ]);

  const totalRevinue = await Subscription.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(startDate), $lt: new Date(endDate) },
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: '$price',
        },
      },
    },
  ]);

  console.log();

  const totalPosts = await Post.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(startDate), $lt: new Date(endDate) },
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: 1,
        },
      },
    },
  ]);

  const details = {
    totalJobSeeker: totalJobSeeker.length > 0 ? totalJobSeeker[0]?.total : 0,
    totalRecruiter: totalRecruiter.length > 0 ? totalRecruiter[0]?.total : 0,
    totalRevinue: totalRevinue.length > 0 ? totalRevinue[0]?.total : 0,
    totalPosts: totalPosts.length > 0 ? totalPosts[0]?.total : 0,
  };

  const grandTotal = Object.values(details).reduce((a, b) => a + b, 0);
  const percentage = {
    totalJobSeeker: (
      ((totalJobSeeker.length > 0 ? totalJobSeeker[0]?.total : 0) /
        grandTotal) *
      100
    ).toFixed(2),
    totalRecruiter: (
      ((totalRecruiter.length > 0 ? totalRecruiter[0]?.total : 0) /
        grandTotal) *
      100
    ).toFixed(2),
    totalRevinue: (
      ((totalRevinue.length > 0 ? totalRevinue[0]?.total : 0) / grandTotal) *
      100
    ).toFixed(2),
    totalPosts: (
      ((totalPosts.length > 0 ? totalPosts[0]?.total : 0) / grandTotal) *
      100
    ).toFixed(2),
  };

  const data = {
    details,
    percentage,
  };

  await RedisHelper.redisSet(`manual_search_details`, data, {
    startDate,
    endDate,
  });

  return data;
};

export const DashboardServices = {
  getSummuryFromDb,
  weeklyReportFromDB,
  monthlyReportFromDB,
  manualSearchDetails,
};
