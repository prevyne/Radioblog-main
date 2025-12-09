import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MAPPINGS_PATH = path.join(process.cwd(), 'scripts', 'output', 'file_mappings.json');
const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || process.env.MONGODB_URI;

if (!fs.existsSync(MAPPINGS_PATH)) {
  console.error('Mappings file not found at', MAPPINGS_PATH);
  process.exit(1);
}

if (!MONGO_URI) {
  console.error('MONGO_URI (or DATABASE_URL) is required in environment to connect to MongoDB');
  process.exit(1);
}

const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
const mapByFile = Object.fromEntries(mappings.map(m => [m.file, m.url]));

// Load Posts model dynamically to avoid ESM import complexities
const PostsModelPath = path.join(process.cwd(), 'server', 'models', 'Posts.js');

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  // require the model after connecting
  const Posts = (await import('../models/Posts.js')).default;

  const dryRun = process.argv.includes('--dry');

  console.log('Starting update-post-images. Dry run:', dryRun);

  for (const { file, url } of mappings) {
    // Try matching common patterns: filename, uploads/filename
    const candidates = [file, `uploads/${file}`, encodeURIComponent(file)];
    const query = { img: { $in: candidates } };

    const posts = await Posts.find(query).lean();
    if (!posts.length) continue;

    for (const post of posts) {
      console.log(`${dryRun ? '[DRY]' : '[UPDATE]'} Post ${post._id} - ${post.title} -> ${url}`);
      if (!dryRun) {
        await Posts.updateOne({ _id: post._id }, { $set: { img: url } });
      }
    }
  }

  console.log('Done updating images. Closing DB connection.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error updating post images:', err);
  process.exit(1);
});
