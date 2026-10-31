import mongoose from 'mongoose';
import config from '../config';
import { Category } from '../app/modules/category/category.model';
import { Post } from '../app/modules/post/post.model';
import { RedisHelper } from '../tools/redis/redis.helper';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const backfillCategoryJobCounts = async () => {
  await mongoose.connect(config.database_url as string);

  const categories = await Category.find({}).select('name').lean();
  const matchers = categories.map(category => ({
    id: category._id.toString(),
    name: category.name,
    regex: new RegExp(escapeRegex(category.name), 'i'),
    count: 0,
  }));
  const cursor = Post.find({}, { category: 1, category_string: 1, title: 1 })
    .lean()
    .cursor({ batchSize: 1000 });
  let scanned = 0;

  while (true) {
    const post = await cursor.next();
    if (!post) break;

    for (const matcher of matchers) {
      if (
        post.category?.toString() === matcher.id ||
        post.category_string === matcher.name ||
        (typeof post.title === 'string' && matcher.regex.test(post.title))
      ) {
        matcher.count += 1;
      }
    }

    scanned += 1;
    if (scanned % 100000 === 0) {
      console.log(`Scanned ${scanned} posts`);
    }
  }

  if (matchers.length) {
    await Category.bulkWrite(
      matchers.map(({ id, count }) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { _job_count: count } },
        },
      }))
    );
  }

  await RedisHelper.keyDelete('all_category:*');
  console.log(`Updated category counts after scanning ${scanned} posts`);
};

backfillCategoryJobCounts()
  .catch(error => {
    console.error('Category count backfill failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
