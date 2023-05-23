const cluster = require('cluster');
const { ioc, factory } = require('@toxo/ioc');
const { MongodbProvider, DatabaseManager } = require('../src');
const config = require('./config.json');

const logEventFn = (eventName) => logger.log(`****${eventName}`);
const logger = ioc.get('logger');

async function configureDatabase() {
  factory.register(MongodbProvider);
  const dbManager = await DatabaseManager.createFrom(config.databases);
  ioc.register('databaseManager', dbManager);
  const collection = dbManager.getMainCollection('tenants');
  collection.addHook('beforeAll', logEventFn, -1);
  await dbManager.start();
}

async function wait(seconds) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), seconds * 1000);
  });
}

async function orchestrate() {
  logger.log(`Starting Primary process with PID ${process.pid}`);
  for (let i = 0; i < 4; i += 1) {
    cluster.fork();
    // eslint-disable-next-line no-await-in-loop
    await wait(0.01);
  }
}

async function serve() {
  logger.log(`Worker with PID ${process.pid} started.`);
  await configureDatabase();
  const dbManager = ioc.get('databaseManager');
  const collection = dbManager.getMainCollection('tenants');
  let item = await collection.findById('61925b2574ad1ebeff6c179c');
  logger.log(item.tenantId);
  item = await collection.findById('61925b2574ad1ebeff6c179c');
  logger.log(item.tenantId);
  item = await collection.findOne({
    tenantId: '49ba9f38-9749-4885-a86c-170afff9a5b7',
  });
  logger.log(item.tenantId);
  item = await collection.findOne({
    tenantId: '73832b67-1b07-41b3-8ee1-36694b0af628',
  });
  logger.log(item.tenantId);
}

(async () => {
  if (cluster.isPrimary) {
    await orchestrate();
  } else {
    await serve();
  }
})();
