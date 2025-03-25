const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const path = require('path');
const mime = require('mime-types');
const { ObjectId } = require('mongodb');
const { error } = require('console');

class FilesController {
  static async postUpload(req, res) {
    // auth
    const token = req.headers['x-token'];
    const key = `auth_${token}`;

    console.log(`Looking for token: ${key}`);
    const userId = await redisClient.get(key);
    console.log(`Found userId: ${userId}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // validate params
    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    const validTypes = ['folder', 'file', 'image'];
    if (!type) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    // parent validate
    let parentFile = null;
    if (parentId !== 0) {
      parentFile = await dbClient.db
        .collection('files')
        .findOne({ _id: ObjectId(parentId) });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    // file structure
    const file = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      data,
      parentId: parentId === 0 ? 0 : ObjectId(parentId),
    };

    // handle the folder
    if (type === 'folder') {
      const result = await dbClient.db.collection('files').insertOne(file);
      return res.status(201).json({
        id: result.insertedId,
        file,
        parentId: parentId === 0 ? 0 : parentId.toString(),
      });
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const filename = uuidv4();
    const localPath = path.join(folderPath, filename);

    // make sure directory exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // write the file
    const fileContent = Buffer.from(data, 'base64');
    fs.writeFileSync(localPath, fileContent);

    file.localPath = localPath;

    const result = await dbClient.db.collection('files').insertOne(file);

    return res.status(201).json({
      id: result.insertedId,
      file,
      parentId: parentId === 0 ? 0 : parentId.toString(),
    });
  }

  static async getShow(req, res) {
    // Retrieve user based on token
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get file ID from route parameters
    const fileId = req.params.id;

    //Fetch file document from the DB
    const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId), userId: ObjectId(userId) });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file)
  }

  static async getIndex(req, res) {
    // Retrieve user based on token
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get parent ID
    const parentId = req.params.id;
    // Get page ID
    const pageId = req.params.id;


  }
}

module.exports = FilesController;
