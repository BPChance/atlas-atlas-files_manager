const redis = require('redis');

class RedisClient {
  constructor() {
    // creates a client to Redis
    this.client = redis.createClient();
    this.client.on('error', (err) =>
      console.error(`Redis client error: ${err}`)
    );
  }

  isAlive() {
    // returns true when connection to Redis is success otherwise, false
    return this.client.connected;
  }

  async get(key) {
    // takes string key as arg and returns Redis value stored for this key
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, value) => {
        if (err) reject(err);
        resolve(value);
      });
    });
  }

  async set(key, value, duration) {
    // that takes a string key, a value and a duration in second as arguments to store it in Redis (with an expiration set by the duration argument)
    return new Promise((resolve, reject) => {
      this.client.setex(key, duration, value, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  async del(key) {
    // that takes a string key as argument and remove the value in Redis for this key
    return new Promise((resolve, reject) => {
      this.client.del(key, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
