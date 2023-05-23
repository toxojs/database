const baseCachedCollection = require('./base-cached-collection');
const baseCollection = require('./base-collection');
const cachedCollection = require('./cached-collection');
const collection = require('./collection');
const database = require('./database');
const mongodbProvider = require('./mongo-provider');
const sharedCollection = require('./shared-collection');
const databaseManager = require('./database-manager');

module.exports = {
  ...baseCachedCollection,
  ...baseCollection,
  ...cachedCollection,
  ...collection,
  ...database,
  ...mongodbProvider,
  ...sharedCollection,
  ...databaseManager,
};
