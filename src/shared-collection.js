const { getSharedMemory } = require('@toxo/memory');
const { BaseCachedCollection } = require('./base-cached-collection');

class SharedCollection extends BaseCachedCollection {
  constructor(settings) {
    super(settings);
    this.memory = getSharedMemory();
  }

  addData(settings) {
    return this.memory.addData({
      ...settings,
      collectionName: settings.collectionName || this.name,
    });
  }

  getFromCache(condition) {
    const keys = Object.keys(condition);
    if (keys.length !== 1) {
      return undefined;
    }
    const key = keys[0];
    return this.memory.getFromDataByIndex({
      collectionName: this.name,
      field: key,
      value: condition[key],
    });
  }

  putIntoCache(item) {
    return this.memory.putIntoData({ collectionName: this.name, item });
  }

  removeFromCache(id) {
    return this.memory.removeFromData({ collectionName: this.name, id });
  }

  clearCache() {
    return this.memory.clearData({ collectionName: this.name });
  }
}

module.exports = {
  SharedCollection,
};
