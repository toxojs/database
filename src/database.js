const { ioc, factory } = require('@toxo/ioc');
const { CachedCollection } = require('./cached-collection');
const { SharedCollection } = require('./shared-collection');

class Database {
  constructor(settings = {}) {
    this.defaultProviderName = settings.defaultProviderName;
    this.providers = new Map();
    this.collectionProviders = new Map();
    this.started = false;
  }

  addProvider(providerName, provider) {
    if (typeof providerName !== 'string') {
      return this.addProvider(providerName.constructor.name, providerName);
    }
    this.providers.set(providerName, provider);
    if (!this.defaultProviderName) {
      this.defaultProviderName = providerName;
    }
    return provider;
  }

  getProvider(providerName) {
    const provider = this.providers.get(
      providerName || this.defaultProviderName
    );
    if (!provider) {
      return ioc.get(providerName);
    }
    return typeof provider === 'string' ? ioc.get(provider) : provider;
  }

  getCollectionProvider(collectionName) {
    const providerName =
      this.collectionProviders.get(collectionName) || this.defaultProviderName;
    return providerName ? this.getProvider(providerName) : undefined;
  }

  getCollection(collectionName) {
    const provider = this.getCollectionProvider(collectionName);
    if (!provider) {
      throw new Error(
        `Database provider not found for collection ${collectionName}`
      );
    }
    return provider.getCollection(collectionName);
  }

  setCollection(collectionName, collection) {
    const provider = this.getCollectionProvider(collectionName);
    if (!provider) {
      throw new Error(
        `Database provider not found for collection ${collectionName}`
      );
    }
    return provider.setCollection(collectionName, collection);
  }

  async addCollectionProvider(collectionName, providerName, options = {}) {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(
        `Database provider ${providerName} not found for collection ${collectionName}`
      );
    }
    this.collectionProviders.set(collectionName, providerName);
    if (options.type === 'cached') {
      const sourceCollection = provider.getCollection(collectionName);
      const settings = {
        db: provider,
        name: collectionName,
        dbCollection: sourceCollection,
        ...options,
      };
      const collection = new CachedCollection(settings);
      this.setCollection(collectionName, collection);
    } else if (options.type === 'shared') {
      const sourceCollection = provider.getCollection(collectionName);
      const settings = {
        db: provider,
        name: collectionName,
        dbCollection: sourceCollection,
      };
      const collection = new SharedCollection(settings);
      await collection.addData(options);
      this.setCollection(collectionName, collection);
    }
  }

  get isStarted() {
    return this.started;
  }

  async start() {
    if (!this.started) {
      const keys = Array.from(this.providers.keys());
      for (let i = 0; i < keys.length; i += 1) {
        const provider = this.getProvider(keys[i]);
        if (provider && !provider.isStarted) {
          // eslint-disable-next-line no-await-in-loop
          await provider.start();
        }
      }
      this.started = true;
    }
  }

  async stop() {
    if (this.started) {
      const keys = Array.from(this.providers.keys());
      for (let i = 0; i < keys.length; i += 1) {
        const provider = this.getProvider(keys[i]);
        if (provider && provider.isStarted) {
          // eslint-disable-next-line no-await-in-loop
          await provider.stop();
        }
      }
      this.started = false;
    }
  }

  find(name, condition, limit, offset, sort, projection) {
    return this.getCollection(name).find(
      condition,
      limit,
      offset,
      sort,
      projection
    );
  }

  findOne(name, condition, projection) {
    return this.getCollection(name).findOne(condition, projection);
  }

  exists(name, condition) {
    return this.getCollection(name).exists(condition);
  }

  findById(name, id, projection) {
    return this.getCollection(name).findById(id, projection);
  }

  existsById(name, id) {
    return this.getCollection(name).existsById(id);
  }

  insertOne(name, item) {
    return this.getCollection(name).insertOne(item);
  }

  insertMany(name, items) {
    return this.getCollection(name).insertMany(items);
  }

  update(name, item) {
    return this.getCollection(name).update(item);
  }

  updateMany(name, filter, updateFilter, options) {
    return this.getCollection(name).updateMany(filter, updateFilter, options);
  }

  replace(name, item) {
    return this.getCollection(name).replace(item);
  }

  save(name, item) {
    return this.getCollection(name).save(item);
  }

  remove(name, condition, justOne = false) {
    return this.getCollection(name).remove(condition, justOne);
  }

  removeById(name, id) {
    return this.getCollection(name).removeById(id);
  }

  addIndex(name, index, options = undefined) {
    return this.getCollection(name).addIndex(index, options);
  }

  count(name, condition = {}) {
    return this.getCollection(name).count(condition);
  }

  drop(name) {
    return this.getCollection(name).drop();
  }

  insertByBatches(name, items, batchSize = 100) {
    return this.getCollection(name).insertByBatches(items, batchSize);
  }

  updateByBatches(name, items, batchSize = 100) {
    return this.getCollection(name).updateByBatches(items, batchSize);
  }

  removeByIdByBatches(name, ids, batchSize = 100) {
    return this.getCollection(name).removeByIdByBatches(ids, batchSize);
  }

  aggregate(name, agg) {
    return this.getCollection(name).aggregate(agg);
  }

  findOneAndReplace(name, query, srcItem, options) {
    return this.getCollection(name).findOneAndReplace(query, srcItem, options);
  }

  findOneAndUpdate(name, query, operations, options) {
    return this.getCollection(name).findOneAndUpdate(
      query,
      operations,
      options
    );
  }

  findOneAndDelete(name, query, options) {
    return this.getCollection(name).findOneAndDelete(query, options);
  }

  rename(name, newName) {
    return this.getCollection(name).rename(newName);
  }

  async addProviderFromConfig(providerName, config) {
    const provider = factory.getInstance(config.provider, config);
    this.addProvider(providerName, provider);
    if (config.collections) {
      const keys = Object.keys(config.collections);
      for (let i = 0; i < keys.length; i += 1) {
        const collectionName = keys[i];
        const collectionConfig = config.collections[collectionName];
        // eslint-disable-next-line no-await-in-loop
        await this.addCollectionProvider(
          collectionName,
          providerName,
          collectionConfig
        );
      }
    }
  }

  async fromConfig(config) {
    await this.addProviderFromConfig(config.name || 'main', config);
    if (config.providers) {
      const entries = Object.entries(config.providers);
      for (let i = 0; i < entries.length; i += 1) {
        const [providerName, providerConfig] = entries[i];
        // eslint-disable-next-line no-await-in-loop
        await this.addProviderFromConfig(providerName, providerConfig);
      }
    }
  }
}

module.exports = {
  Database,
};
