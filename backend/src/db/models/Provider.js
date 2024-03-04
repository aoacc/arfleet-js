const Model = require('./base');
const Sequelize = require('sequelize');

class Provider extends Model {
    constructor(...args) {
        super(...args);
    }
}

Provider.init(
    {
        id: {type: Sequelize.DataTypes.STRING, unique: true, primaryKey: true},
        connection_strings: {type: Sequelize.DataTypes.JSON, allowNull: true},
        prices: {type: Sequelize.DataTypes.JSON, allowNull: true},
    },
    {
        indexes: [
        ]
    }
);

module.exports = Provider;