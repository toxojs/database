const { BaseCollection } = require('./base-collection');

class Collection extends BaseCollection {
  innerFind({ condition, limit, offset, sort, projection }) {
    return this.db.find(this.name, condition, limit, offset, sort, projection);
  }

  innerFindOne({ condition, projection }) {
    return this.db.findOne(this.name, condition, projection);
  }

  innerExists({ condition }) {
    return this.db.exists(this.name, condition);
  }

  innerFindById({ id, projection }) {
    return this.db.findById(this.name, id, projection);
  }

  innerExistsById({ id }) {
    return this.db.existsById(this.name, id);
  }

  innerInsertOne({ item }) {
    return this.db.insertOne(this.name, item);
  }

  innerInsertMany({ items }) {
    return this.db.insertMany(this.name, items);
  }

  innerUpdate({ item }) {
    return this.db.update(this.name, item);
  }

  innerUpdateMany({ filter, updateFilter, options }) {
    return this.db.updateMany(this.name, filter, updateFilter, options);
  }

  innerReplace({ item }) {
    return this.db.replace(this.name, item);
  }

  innerSave({ item }) {
    return this.db.save(this.name, item);
  }

  innerRemove({ condition, justOne }) {
    return this.db.remove(this.name, condition, justOne);
  }

  innerRemoveById({ id }) {
    return this.db.removeById(this.name, id);
  }

  innerAddIndex({ index, options }) {
    return this.db.addIndex(this.name, index, options);
  }

  innerCount({ condition }) {
    return this.db.count(this.name, condition);
  }

  innerDrop() {
    return this.db.drop(this.name);
  }

  innerInsertByBatches({ items, batchSize }) {
    return this.db.insertByBatches(this.name, items, batchSize);
  }

  innerUpdateByBatches({ items, batchSize }) {
    return this.db.updateByBatches(this.name, items, batchSize);
  }

  innerRemoveByIdByBatches({ ids, batchSize }) {
    return this.db.removeByIdByBatches(this.name, ids, batchSize);
  }

  innerAggregate({ agg }) {
    return this.db.aggregate(this.name, agg);
  }

  innerFindOneAndReplace({ query, item, options }) {
    return this.db.findOneAndReplce(this.name, query, item, options);
  }

  innerFindOneAndUpdate({ query, operations, options }) {
    return this.db.findOneAndUpdate(this.name, query, operations, options);
  }

  innerFindOneAndDelete({ query, options }) {
    return this.db.findOneAndDelete(this.name, query, options);
  }

  innerRename({ newName }) {
    return this.db.rename(this.name, newName);
  }
}

module.exports = { Collection };
