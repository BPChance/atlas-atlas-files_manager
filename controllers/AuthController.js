const sha1 = require('crypto-js/sha1');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');


class AuthController {
    static async getConnect(req, res) {
        const authHeader = req.header('Authorization');

        if (!authHeader || !authHeader.startsWith('Basic ')) {
            return res.status(401).json({ error: 'Unauthorized'});
        }

        const base64Credentials = authHeader.split(' ')[1];
        const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        const [email, password] = decodedCredentials.split(':');

        if (!email || !password) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const hashedPassword = sha1(password).toString();

        try {
            const user = await dbClient.db.collection('users').findOne({ email, password: hashedPassword });

            if (!user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const token = uuidv4();
            const key = `auth_${token}`;
            await redisClient.set(key, user._id.toString(), 86400);

            return res.status(200).json({ token });
        } catch (err) {
            console.error('Auth error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getDisconnect(req, res) {
        const token = req.header('X-Token');
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const key = `auth_${token}`;
        const userId = await redisClient.get(key);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await redisClient.del(key);
        return res.status(204).send();
    }
}

module.exports = AuthController;