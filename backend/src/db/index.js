const utils = require('../utils');
const config = require('../config');
const path = require('path');

const {Sequelize, Transaction} = require('sequelize');

// const log = logger.child({module: 'Sequelize'});

class Database {
    static client;

    static init() {
        if (!Database.client) {
            const dbConfig = config.db;
            const storage = utils.getDatadir(dbConfig.storage);
            Database.client = new Sequelize(
                dbConfig.database,
                dbConfig.username,
                dbConfig.password,
                {
                    dialect: dbConfig.dialect,
                    define: dbConfig.define,
                    storage,
                    transactionType: dbConfig.transactionType,
                    retry: {max: dbConfig.retry.max},
                    // logQueryParameters: true,
                    // logging: config.get('db.enable_db_logging') ? log.trace.bind(log) : false,
                    isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
                }
            );
        }

        return Database.client;
    }
}

module.exports = {Database};
