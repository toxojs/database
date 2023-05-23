class BaseCollection {
  constructor(settings) {
    if (!settings) {
      throw new Error('settings are required');
    }
    if (!settings.db) {
      throw new Error('settings.db is required');
    }
    if (!settings.name) {
      throw new Error('settings.name is required');
    }
    this.db = settings.db;
    this.name = settings.name;
    this.hooks = new Map();
  }

  getCollectionAtDepth(srcDepth) {
    let current = this;
    let depth = srcDepth;
    while (current.dbCollection && (depth === -1 || depth > 0)) {
      current = current.dbCollection;
      if (depth !== -1) {
        depth -= 1;
      }
    }
    return current;
  }

  addHook(event, hook, depth = 0) {
    const collection = this.getCollectionAtDepth(depth);
    if (!collection.hooks.has(event)) {
      collection.hooks.set(event, []);
    }
    collection.hooks.get(event).push(hook);
  }

  async callHook(hookName, eventName, data) {
    let newData = { ...data };
    const hooks = this.hooks.get(hookName) || [];
    for (let i = 0; i < hooks.length; i += 1) {
      const hook = hooks[i];
      // eslint-disable-next-line no-await-in-loop
      const changes = await hook(eventName, this, newData);
      newData = { ...newData, ...(changes || {}) };
    }
    return newData;
  }

  async callHooks(eventName, data) {
    let newData = data;
    if (this.hooks.has('beforeAll') && eventName.startsWith('before')) {
      newData = await this.callHook('beforeAll', eventName, newData);
    } else if (this.hooks.has('afterAll') && eventName.startsWith('after')) {
      newData = await this.callHook('afterAll', eventName, newData);
    }
    if (!this.hooks.has(eventName)) {
      return newData;
    }
    newData = await this.callHook(eventName, eventName, newData);
    return newData;
  }

  async executeHooked(methodName, srcOptions) {
    let options = srcOptions;
    options = await this.callHooks(`before${methodName}`, options);
    if (options.result) {
      return options.result;
    }
    options.result = await this[`inner${methodName}`](options);
    options = await this.callHooks(`after${methodName}`, options);
    return options.result;
  }

  find(condition, limit, offset, sort, projection) {
    return this.executeHooked('Find', {
      condition,
      limit,
      offset,
      sort,
      projection,
    });
  }

  findOne(condition, projection) {
    return this.executeHooked('FindOne', { condition, projection });
  }

  exists(condition) {
    return this.executeHooked('Exists', { condition });
  }

  findById(id, projection) {
    return this.executeHooked('FindById', { id, projection });
  }

  existsById(id) {
    return this.executeHooked('ExistsById', { id });
  }

  insertOne(item) {
    return this.executeHooked('InsertOne', { item });
  }

  insertMany(items) {
    return this.executeHooked('InsertMany', { items });
  }

  update(item) {
    return this.executeHooked('Update', { item });
  }

  updateMany(filter, updateFilter, options) {
    return this.executeHooked('UpdateMany', { filter, updateFilter, options });
  }

  replace(item) {
    return this.executeHooked('Replace', { item });
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
}

module.exports = {
  BaseCollection,
};
