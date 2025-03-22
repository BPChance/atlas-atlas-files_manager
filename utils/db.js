const { MongoClient } = require('mongodb');
const { configDotenv } = require('dotenv');

configDotenv();

class DBClient {
  constructor() {
    const database = process.env.DB_DATABASE || 'files_manager';

    this.url = process.env.MONGODB_URI;
    this.client = new MongoClient(this.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    this.db = null;

    this.client
      .connect()
      .then(() => {
        this.db = this.client.db(database);
      })
      .catch((err) => {
        console.error('Failed to connect to MongoDB:', err);
        this.db = null;
      });
  }

  isAlive() {
    return (
      !!this.client &&
      this.client.topology &&
      this.client.topology.isConnected()
    );
  }

  async nbUsers() {
    if (!this.db) return 0;
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    if (!this.db) return 0;
    return this.db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
