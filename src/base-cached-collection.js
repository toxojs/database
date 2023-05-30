const { BaseCollection } = require('./base-collection');
const { Collection } = require('./collection');

class BaseCachedCollection extends BaseCollection {
  constructor(settings) {
    super(settings);
    this.dbCollection = settings.dbCollection || new Collection(settings);
  }

  innerFind(condition, limit, offset, sort, projection) {
    return this.dbCollection.find(condition, limit, offset, sort, projection);
  }

  async innerFindOne({ condition, projection }) {
    let result;
    if (!projection) {
      result = await this.getFromCache(condition);
    }
    if (!result) {
      result = await this.dbCollection.findOne(condition, projection);
      if (result && !projection) {
        await this.putIntoCache(result);
      }
    }
    return result;
  }

  async innerExists({ condition }) {
    const item = await this.getFromCache(condition);
    return item ? Promise.resolve(true) : this.dbCollection.exists(condition);
  }

  async innerFindById({ id, projection }) {
    let item;
    if (!projection) {
      item = await this.getFromCache({ id });
    }
    if (!item) {
      item = await this.dbCollection.findById(id, projection);
      if (item && !projection) {
        await this.putIntoCache(item);
      }
    }
    return item;
  }

  async innerExistsById({ id }) {
    const item = await this.getFromCache({ id });
    if (item) {
      return Promise.resolve(true);
    }
    return this.dbCollection.existsById(id);
  }

  async innerInsertOne({ item }) {
    const result = await this.dbCollection.insertOne(item);
    await this.putIntoCache(result);
    return result;
  }

  async innerInsertMany({ items }) {
    const result = await this.dbCollection.insertMany(items);
    for (let i = 0; i < result.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await this.putIntoCache(result[i]);
    }
    return result;
  }

  async innerUpdate({ item }) {
    const result = await this.dbCollection.update(item);
    await this.putIntoCache(result);
    return result;
  }

  async innerUpdateMany({ filter, updateFilter, options }) {
    const result = await this.dbCollection.updateMany(
      filter,
      updateFilter,
      options
    );
    for (let i = 0; i < result.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await this.putIntoCache(result[i]);
    }
    return result;
  }

  async innerReplace({ item }) {
    const result = await this.dbCollection.replace(item);
    await this.putIntoCache(result);
    return result;
  }

  async innerSave({ item }) {
    const result = await this.dbCollection.save(item);
    await this.putIntoCache(result);
    return result;
  }

  innerRemove({ condition, justOne }) {
    return this.dbCollection.remove(condition, justOne);
  }

  async innerRemoveById({ id }) {
    const result = await this.dbCollection.removeById(id);
    await this.removeFromCache(id);
    return result;
  }

  innerAddIndex({ index, options }) {
    return this.dbCollection.addIndex(index, options);
  }

  innerCount({ condition }) {
    return this.dbCollection.count(condition);
  }

  async innerDrop() {
    await this.clearCache();
    return this.dbCollection.drop();
  }

  innerInsertByBatches({ items, batchSize }) {
    return this.dbCollection.insertByBatches(items, batchSize);
  }

  innerUpdateByBatches({ items, batchSize }) {
    return this.dbCollection.updateByBatches(items, batchSize);
  }

  async innerRemoveByIdByBatches({ ids, batchSize }) {
    for (let i = 0; i < ids.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await this.removeFromCache(ids[i]);
    }
    return this.dbCollection.removeByIdByBatches(ids, batchSize);
  }

  innerAggregate({ agg }) {
    return this.dbCollection.aggregate(agg);
  }

  innerFindOneAndReplace({ query, item, options }) {
    return this.dbCollection.findOneAndReplace(query, item, options);
  }

  innerFindOneAndUpdate({ query, operations, options }) {
    return this.dbCollection.findOneAndUpdate(query, operations, options);
  }

  innerFindOneAndDelete({ query, options }) {
    return this.dbCollection.findOneAndDelete(query, options);
  }

  innerRename({ newName }) {
    return this.dbCollection.rename(newName);
  }
}

module.exports = {
  BaseCachedCollection,
};
