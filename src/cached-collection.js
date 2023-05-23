const { Cache } = require('@toxo/cache');
const { BaseCachedCollection } = require('./base-cached-collection');

class CachedCollection extends BaseCachedCollection {
  constructor(settings) {
    super(settings);
    this.cache = new Cache(settings);
  }

  getFromCache(condition) {
    const keys = Object.keys(condition);
    if (keys.length !== 1) {
      return undefined;
    }
    const key = keys[0];
    return this.cache.getByIndex(key, condition[key]);
  }

  putIntoCache(item) {
    this.cache.put(item);
  }

  removeFromCache(id) {
    this.cache.remove(id);
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = {
  CachedCollection,
};
