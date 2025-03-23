const crypto = require('crypto');
const DBClient = require('../utils/db');
const { error } = require('console');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');
const { ObjectId } = require('mongodb');
const { emit } = require('process');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    // check if email or password is missing
    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });

    try {
      const usersCollection = DBClient.db.collection('users');

      // check if email already exists
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) return res.status(400).json({ error: 'Already exist' });

      // hash password using SHA1
      const sha1Hash = crypto.createHash('sha1');
      sha1Hash.update(password);
      const hashedPassword = sha1Hash.digest('hex');

      const result = await usersCollection.insertOne({
        email,
        password: hashedPassword,
      });

      // return new users id and email
      return res.status(201).json({ id: result.insertedId, email });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized'});
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      return res.status(200).json({ id: user._id, email: user.email });
    } catch (err) {
      console.error('Error retrieving user:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = UsersController;