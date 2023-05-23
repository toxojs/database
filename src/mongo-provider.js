const { MongoClient, ObjectId } = require('mongodb');
const { Collection } = require('./collection');

const idField = '_id';

const isMongoId = (str) => {
  let oid;
  try {
    oid = new ObjectId(str);
    return oid.toString() === str;
  } catch (err) {
    return false;
  }
};

function processIds(condition) {
  return typeof condition === 'string' && isMongoId(condition)
    ? new ObjectId(condition)
    : condition;
}

class MongodbProvider {
  constructor(settings = {}) {
    this.collections = new Map();
    this.settings = settings;
    this.createClient();
  }

  createClient() {
    if (!this.settings.url) {
      this.settings.url = process.env.MONGO_URL;
    }
    const { url } = this.settings;
    if (url) {
      if (!this.settings.dbName) {
        this.settings.dbName = url.slice(url.lastIndexOf('/') + 1);
        if (this.settings.dbName.endsWith('?')) {
          this.settings.dbName = this.settings.dbName.slice(0, -1);
        }
      }
      this.client = new MongoClient(url);
    }
  }

  get isStarted() {
    return this.client !== undefined && this.db !== undefined;
  }

  async start() {
    await this.client.connect();
    this.db = this.client.db(this.settings.dbName);
  }

  async stop() {
    if (this.isStarted) {
      await this.client.close();
    }
    this.db = undefined;
  }

  convertOut(srcInput) {
    if (Array.isArray(srcInput)) {
      return srcInput.map((item) => this.convertOut(item));
    }
    if (srcInput[idField]) {
      const input = { ...srcInput };
      input.id = input[idField].toString();
      delete input[idField];
      return input;
    }
    return srcInput;
  }

  static asDBKey(key) {
    return typeof key === 'string' ? new ObjectId(key) : key;
  }

  convertIn(srcInput) {
    if (Array.isArray(srcInput)) {
      return srcInput.map((item) => this.convertIn(item));
    }
    if (srcInput.id) {
      const input = { ...srcInput };
      input[idField] = MongodbProvider.asDBKey(input[idField]);
      delete input.id;
      return input;
    }
    return srcInput;
  }

  getCollection(name) {
    if (!this.collections.has(name)) {
      const collection = new Collection({ db: this, name });
      this.collections.set(name, collection);
    }
    return this.collections.get(name);
  }

  setCollection(name, collection) {
    this.collections.set(name, collection);
  }

  getMongoCollection(name) {
    if (!this.isStarted) {
      throw new Error('Database is not started');
    }
    return this.db.collection(name);
  }

  async find(
    name,
    srcCondition,
    limit,
    offset,
    sort = undefined,
    projection = undefined
  ) {
    const condition = { ...srcCondition };
    if (condition.id) {
      condition[idField] = new ObjectId(condition.id);
      delete condition.id;
    }
    const collection = this.getMongoCollection(name);
    const options = {
      ...(limit && { limit }),
      ...(offset && { skip: offset }),
      ...(sort && { sort }),
      ...(projection && { projection }),
    };
    try {
      const items = await collection
        .find(processIds(condition || {}), options)
        .toArray();
      return this.convertOut(items);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async findOne(name, condition = {}, projection = undefined) {
    const collection = this.getMongoCollection(name);
    const options = {
      ...(projection && { projection }),
    };
    const item = await collection.findOne(condition, options);
    return this.convertOut(item);
  }

  async exists(name, condition) {
    if (typeof condition === 'string') {
      return this.existsById(name, condition);
    }
    const item = await this.findOne(name, condition);
    return !!item;
  }

  async findById(name, id, projection = undefined) {
    try {
      const result = await this.findOne(
        name,
        { [idField]: new ObjectId(id) },
        projection
      );
      return this.convertOut(result);
    } catch (err) {
      return Promise.resolve(null);
    }
  }

  async existsById(name, id) {
    const item = await this.findById(name, id);
    return !!item;
  }

  async insertOne(name, srcItem) {
    const item = this.convertIn(srcItem);
    const collection = this.getMongoCollection(name);
    await collection.insertOne(item);
    return this.convertOut(item);
  }

  async insertMany(name, srcItems) {
    const items = this.convertIn(srcItems);
    const collection = this.getMongoCollection(name);
    await collection.insertMany(items);
    return this.convertOut(items);
  }

  async update(name, srcItem) {
    const item = this.convertIn(srcItem);
    const query = { [idField]: new ObjectId(item[idField]) };
    delete item[idField];
    delete item.id;
    const newValues = { $set: item };
    const collection = this.getMongoCollection(name);
    await collection.updateOne(query, newValues);
    const result = await collection.findOne(query);
    return this.convertOut(result);
  }

  async updateMany(name, filter, updateFilter, options, isPipeline = false) {
    let argument;
    if (isPipeline) {
      argument = Array.isArray(updateFilter)
        ? updateFilter
        : [{ $set: updateFilter }];
    } else {
      argument = { $set: updateFilter };
    }
    const collection = this.getMongoCollection(name);
    return collection.updateMany(filter, argument, options);
  }

  async replace(name, srcItem) {
    const item = this.convertIn(srcItem);
    const query = { [idField]: new ObjectId(item[idField]) };
    delete item[idField];
    delete item.id;
    const newValues = { ...item };
    const collection = this.getMongoCollection(name);
    await collection.replaceOne(query, newValues);
    const result = await collection.findOne(query);
    return this.convertOut(result);
  }

  async save(name, srcItem) {
    const item = this.convertIn(srcItem);
    if (!item[idField]) {
      return this.insertOne(name, srcItem);
    }
    const alreadyExists = await this.exists(name, item[idField]);
    return alreadyExists
      ? this.update(name, srcItem)
      : this.insertOne(name, item);
  }

  async remove(name, condition, justOne = false) {
    const collection = this.getMongoCollection(name);
    const count = await (justOne
      ? collection.deleteOne(condition)
      : collection.deleteMany(condition));
    return count.acknowledged ? count.deletedCount : 0;
  }

  removeById(name, id) {
    try {
      return this.remove(name, { [idField]: new ObjectId(id) }, true);
    } catch (err) {
      return Promise.resolve(0);
    }
  }

  addIndex(name, fields, options = undefined) {
    const collection = this.getMongoCollection(name);
    return collection.createIndex(fields, options);
  }

  count(name, condition = {}) {
    const query = this.convertIn(condition);
    const collection = this.getMongoCollection(name);
    return collection.count(query);
  }

  drop(name) {
    const collection = this.getMongoCollection(name);
    return collection ? collection.drop() : Promise.resolve();
  }

  async insertByBatches(name, items, batchSize = 100) {
    let index = 0;
    const result = [];
    while (index < items.length) {
      const batch = items.slice(index, index + batchSize);
      index += batchSize;
      // eslint-disable-next-line no-await-in-loop
      const currentResults = await this.insertMany(name, batch);
      result.push(...currentResults);
    }
    return result;
  }

  // eslint-disable-next-line class-methods-use-this
  updateByBatches(name, items, batchSize = 100) {
    console.log(name, items, batchSize);
    throw new Error('not implemented');
  }

  // eslint-disable-next-line class-methods-use-this
  removeByIdByBatches(name, ids, batchSize = 100) {
    console.log(name, ids, batchSize);
    throw new Error('not implemented');
  }

  async aggregate(name, agg) {
    const collection = this.getMongoCollection(name);
    return collection.aggregate(agg).toArray();
  }

  async findOneAndReplace(name, query, srcItem, options) {
    const item = this.convertIn(srcItem);
    const collection = this.getMongoCollection(name);
    return collection.findOneAndReplace(query, item, options);
  }

  async findOneAndUpdate(name, query, operations, options) {
    const collection = this.getMongoCollection(name);
    return collection.findOneAndUpdate(query, operations, options);
  }

  async findOneAndDelete(name, query, options) {
    const collection = this.getMongoCollection(name);
    return collection.findOneAndDelete(query, options);
  }

  async rename(name, newName) {
    const collections = await this.db.listCollections().toArray();
    if (collections.find((collection) => collection.name === name)) {
      const collection = this.getMongoCollection(name);
      return collection.rename(newName);
    }
    return Promise.resolve();
  }
}

module.exports = {
  MongodbProvider,
};
