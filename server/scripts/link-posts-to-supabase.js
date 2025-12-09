import dotenv from 'dotenv';
import mongoose from 'mongoose';
import axios from 'axios';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), 'server', '.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || process.env.MONGODB_URI;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'uploads';
const SUPABASE_PUBLIC = (process.env.SUPABASE_PUBLIC || 'true') === 'true';

if (!MONGO_URI) {
  console.error('MONGO_URI (or DATABASE_URL) is required in environment to connect to MongoDB');
  process.exit(1);
}
if (!SUPABASE_URL) {
  console.error('SUPABASE_URL is required to construct public URLs');
  process.exit(1);
}

(async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const Posts = (await import('../models/Posts.js')).default;

  // Find posts with an img that doesn't look like an absolute URL or not already pointing to supabase
  const posts = await Posts.find({ img: { $exists: true, $ne: null } }).lean();
  console.log(`Found ${posts.length} posts with img field`);

  const candidates = [];

  for (const post of posts) {
    const img = post.img || '';
    // skip if already absolute and points to SUPABASE_URL
    if (/^https?:\/\//i.test(img) && img.includes(new URL(SUPABASE_URL).host)) continue;

    // extract filename
    const basename = path.basename(img.split('?')[0]);
    if (!basename) continue;

    const publicUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/storage/v1/object/public/${SUPABASE_BUCKET}/uploads/${encodeURIComponent(basename)}`;
    candidates.push({ postId: post._id, basename, publicUrl, current: img });
  }

  console.log(`Checking ${candidates.length} candidate files on Supabase...`);

  for (const c of candidates) {
    try {
      // HEAD request to check if file exists
      const res = await axios.head(c.publicUrl, { timeout: 5000 });
      if (res.status === 200) {
        console.log(`Found file for post ${c.postId}: ${c.publicUrl}`);
        if (process.argv.includes('--dry')) {
          console.log('[DRY] Would update post', c.postId);
        } else {
          await Posts.updateOne({ _id: c.postId }, { $set: { img: c.publicUrl } });
          console.log('Updated post', c.postId);
        }
      } else {
        console.log('Not found (status', res.status, ')', c.publicUrl);
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // not found
        // console.log('Not found', c.publicUrl);
      } else {
        console.error('Error checking', c.publicUrl, err.message || err.toString());
      }
    }
  }

  console.log('Done. Closing DB connection.');
  await mongoose.disconnect();
  process.exit(0);
})();
