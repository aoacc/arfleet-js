// Brought over from https://raw.githubusercontent.com/pointnetwork/pointnetwork/develop/src/db/models/base.ts

const sequelize_lib = require('sequelize');
const {Database} = require('..');
const {ModelAttributes, InitOptions, Transaction, UpsertOptions} = sequelize_lib;

class Model extends sequelize_lib.Model {
    constructor(...args) {
        super(...args);
    }

    static get connection() {
        if (!Model._connection) {
            Model._connection = Database.init();
        }
        return Model._connection;
    }

    static init(attributes, options) {
        const defaultOptions = {sequelize: Model.connection};
        options = Object.assign({}, defaultOptions, options);

        const defaultAttributeOptions = {allowNull: false};
        for (const fieldName in attributes) {
            const v = attributes[fieldName];
            if (v === null || v.constructor.name !== 'Object') {
                throw Error(
                    'Oops, I didn\'t think of how to handle this case: the options for attribute \'' +
                        fieldName +
                        '\' are not an object (value: ' +
                        v +
                        ')'
                );
            }
            attributes[fieldName] = Object.assign({}, defaultAttributeOptions, v);
        }

        super.init(attributes, options);
    }

    static async findByIdOrCreate(
        id,
        defaults,
        transaction) {
        const options = {returning: true};
        if (transaction) options.transaction = transaction;

        const upsertResult = await this.upsert(Object.assign({}, {id}, defaults), options);

        if (upsertResult[1] !== null) throw new Error('upsertResult[1] !== null');

        // const instance = upsertResult[0];
        // return instance;

        return await this.findOrFail(id, options);
    }

    async refresh() {
        return await this.reload();
    }

    static async allBy(field, value) {
        const _options = Object.assign({}, {where: {[field]: value}});
        return await this.findAll(_options);
    }

    static async findOneBy(field, value) {
        const collection = await this.findAll({
            where: {[field]: value},
            limit: 1 // Note: we only want one instance
        });
        return collection.length < 1 ? null : collection[0];
    }

    static async findOneByOrFail(field, value) {
        const one = await this.findOneBy(field, value);
        if (one === null) {
            throw Error(
                'Row not found: Model ' + this.constructor.name + ', ' + field + ' #' + value
            );
        } // todo: sanitize!
        return one;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static async find(id, ...args) {
        return await this.findByPk(id, ...args);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static async findOrFail(id, ...args) {
        const result = await this.findByPk(id, ...args);
        if (!result) throw Error('Row not found: Model ' + this.constructor.name + ', id #' + id); // todo: sanitize!
        return result;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static transaction(...args) {
        return this.connection.transaction(...args);
    }

}

module.exports = Model;