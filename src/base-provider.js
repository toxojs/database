const { Collection } = require('./collection');

class BaseProvider {
  constructor(settings = {}) {
    this.settings = settings;
    this.collections = new Map();
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

  find() {
    throw new Error(`find is not implemented in ${this.constructor.name}}`);
  }

  findOne() {
    throw new Error(`findOne is not implemented in ${this.constructor.name}`);
  }

  exists() {
    throw new Error(`exists is not implemented in ${this.constructor.name}`);
  }

  findById() {
    throw new Error(`findById is not implemented in ${this.constructor.name}`);
  }

  existsById() {
    throw new Error(
      `existsById is not implemented in ${this.constructor.name}`
    );
  }

  insertOne() {
    throw new Error(`insertOne is not implemented in ${this.constructor.name}`);
  }

  async insertMany(name, items) {
    for (let i = 0; i < items.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await this.insertOne(name, items[i]);
    }
  }

  update() {
    throw new Error(`update is not implemented in ${this.constructor.name}`);
  }

  updateMany() {
    throw new Error(
      `updateMany is not implemented in ${this.constructor.name}`
    );
  }

  replace() {
    throw new Error(`replace is not implemented in ${this.constructor.name}`);
  }

  save() {
    throw new Error(`save is not implemented in ${this.constructor.name}`);
  }

  remove() {
    throw new Error(`remove is not implemented in ${this.constructor.name}`);
  }

  removeById() {
    throw new Error(
      `removeById is not implemented in ${this.constructor.name}`
    );
  }

  addIndex() {
    throw new Error(`addIndex is not implemented in ${this.constructor.name}`);
  }

  count() {
    throw new Error(`count is not implemented in ${this.constructor.name}`);
  }

  drop() {
    throw new Error(`drop is not implemented in ${this.constructor.name}`);
  }

  insertByBatches() {
    throw new Error(
      `insertByBatches is not implemented in ${this.constructor.name}`
    );
  }

  updateByBatches() {
    throw new Error(
      `updateByBatches is not implemented in ${this.constructor.name}`
    );
  }

  removeByIdByBatches() {
    throw new Error(
      `removeByIdByBatches is not implemented in ${this.constructor.name}`
    );
  }

  aggregate() {
    throw new Error(`aggregate is not implemented in ${this.constructor.name}`);
  }

  findOneAndReplace() {
    throw new Error(
      `findOneAndReplace is not implemented in ${this.constructor.name}`
    );
  }

  findOneAndUpdate() {
    throw new Error(
      `findOneAndUpdate is not implemented in ${this.constructor.name}`
    );
  }

  findOneAndDelete() {
    throw new Error(
      `findOneAndDelete is not implemented in ${this.constructor.name}`
    );
  }

  rename() {
    throw new Error(`rename is not implemented in ${this.constructor.name}`);
  }
}

module.exports = {
  BaseProvider,
};
