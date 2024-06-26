const { Sequelize, QueryInterface } = require('sequelize');
const { Umzug, SequelizeStorage, MigrationError } = require('umzug');
const path = require('path');
const { Database } = require('../db/index');

const glob = require('glob');

const migrate = async () => {
    console.log('Starting database migration');

    const sequelize = Database.init();
    const migrationsGlob = path.join(__dirname, '../../src/migrations/*.js');
    const resolvedMigrationsGlob = path.resolve(migrationsGlob);

    // List files and debug log them
    const files = glob.sync(resolvedMigrationsGlob);
    // console.log({files}, 'Migrations files');

    const context = sequelize.getQueryInterface();

    const umzug = new Umzug({
        migrations: files.map((file) => ({
            name: path.basename(file),
            path: file,
            up: async ({context}) => {
                console.log({name: path.basename(file), file}, 'Migrating');
                const migration = require(file);
                return migration.up(context, Sequelize);
            },
            down: async ({context}) => {
                const migration = require(file);
                return migration.down(context, Sequelize);
            }
        })),
        context: context,
        storage: new SequelizeStorage({sequelize}),
        // logger: log
    });

    // console.log({migrationsGlob}, 'Migrations glob');

    try {
        await umzug.up();
    } catch (e) {
        console.error(e);
        if (e instanceof MigrationError) {
            await umzug.down();
        } else {
            throw e;
        }
    }

    console.log('Database migration finished');
};

module.exports = { migrate };