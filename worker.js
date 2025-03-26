const Queue = require('bull');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs').promises;
const dbClient = require('./utils/db');
const { ObjectId } = require('mongodb');
const path = require('path');

const fileQueue = new Queue('fileQueue', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  // validate job data
  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  // find file document
  const file = await dbClient.db.collection('files').findOne({
    _id: ObjectId(fileId),
    userId: ObjectId(userId),
  });

  if (!file) throw new Error('File not found');
  if (file.type !== 'image') return;

  // generate thumbnails
  const sizes = [500, 250, 100];
  try {
    for (const width of sizes) {
      const thumbnail = await imageThumbnail(file.localPath, { width });
      const thumbnailPath = `${file.localPath}_${width}`;
      await fs.writeFile(thumbnailPath, thumbnail);
    }
  } catch (err) {
    console.error(`Thumbnail generation failed: ${err.message}`);
    throw err;
  }
});
