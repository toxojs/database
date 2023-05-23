const { Database } = require('./database');

const MAIN_DATABASE_NAME = 'main';

class DatabaseManager {
  constructor() {
    this.databases = new Map();
    this.started = false;
  }

  addDatabase(name, database) {
    this.databases.set(name, database || new Database());
    return this.databases.get(name);
  }

  addMainDatabase(database) {
    return this.addDatabase(MAIN_DATABASE_NAME, database);
  }

  getDatabase(name = MAIN_DATABASE_NAME) {
    if (!this.databases.has(name)) {
      this.addDatabase(name);
    }
    return this.databases.get(name);
  }

  getMainDatabase() {
    return this.getDatabase();
  }

  addProvider(databaseName, providerName, provider) {
    const database = this.getDatabase(databaseName);
    database.addProvider(providerName, provider);
  }

  addMainProvider(providerName, provider) {
    this.addProvider(MAIN_DATABASE_NAME, providerName, provider);
  }

  getProvider(databaseName, providerName) {
    const database = this.getDatabase(databaseName);
    return database?.getProvider(providerName);
  }

  getMainProvider(providerName) {
    return this.getProvider(MAIN_DATABASE_NAME, providerName);
  }

  addCollectionProvider(databaseName, collectionName, providerName, options) {
    const database = this.getDatabase(databaseName);
    database.addCollectionProvider(collectionName, providerName, options);
  }

  addMainCollectionProvider(collectionName, providerName, options) {
    this.addCollectionProvider(
      MAIN_DATABASE_NAME,
      collectionName,
      providerName,
      options
    );
  }

  getCollectionProvider(databaseName, collectionName) {
    const database = this.getDatabase(databaseName);
    return database?.getCollectionProvider(collectionName);
  }

  getMainCollectionProvider(collectionName) {
    return this.getCollectionProvider(MAIN_DATABASE_NAME, collectionName);
  }

  getCollection(databaseName, collectionName) {
    const database = this.getDatabase(databaseName);
    return database?.getCollection(collectionName);
  }

  getMainCollection(collectionName) {
    return this.getCollection(MAIN_DATABASE_NAME, collectionName);
  }

  setCollection(databaseName, collectionName, collection) {
    const database = this.getDatabase(databaseName);
    return database?.setCollection(collectionName, collection);
  }

  setMainCollection(collectionName, collection) {
    return this.setCollection(MAIN_DATABASE_NAME, collectionName, collection);
  }

  get isStarted() {
    return this.started;
  }

  async start() {
    if (!this.started) {
      const databases = [...this.databases.values()];
      for (let i = 0; i < databases.length; i += 1) {
        const database = databases[i];
        if (database && !database.isStarted) {
          // eslint-disable-next-line no-await-in-loop
          await database.start();
        }
      }
      this.started = true;
    }
  }

  async stop() {
    if (this.started) {
      const databases = [...this.databases.values()];
      for (let i = 0; i < databases.length; i += 1) {
        const database = databases[i];
        if (database && database.isStarted) {
          // eslint-disable-next-line no-await-in-loop
          await database.stop();
        }
      }
      this.started = false;
    }
  }

  async fromConfig(config) {
    const entries = Object.entries(config);
    for (let i = 0; i < entries.length; i += 1) {
      const [databaseName, databaseConfig] = entries[i];
      const database = this.getDatabase(databaseName);
      // eslint-disable-next-line no-await-in-loop
      await database.fromConfig(databaseConfig);
    }
  }

  static async createFrom(config) {
    const result = new DatabaseManager();
    await result.fromConfig(config);
    return result;
  }
}

module.exports = {
  DatabaseManager,
};
