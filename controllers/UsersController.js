const crypto = require('crypto');
const DBClient = require('../utils/db');

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
}

module.exports = UsersController;
