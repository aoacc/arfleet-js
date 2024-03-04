const Model = require('./base');
const Sequelize = require('sequelize');

class Assignment extends Model {
    constructor(...args) {
        super(...args);
    }
}

Assignment.init(
    {
        id: {type: Sequelize.DataTypes.STRING, unique: true, primaryKey: true},
        size: {type: Sequelize.DataTypes.INTEGER, allowNull: true},
        chunk_count: {type: Sequelize.DataTypes.INTEGER, allowNull: true},
        root_hash: {type: Sequelize.DataTypes.STRING, allowNull: true},
        desired_redundancy: {type: Sequelize.DataTypes.INTEGER, allowNull: true},
        achieved_redundancy: {type: Sequelize.DataTypes.INTEGER, allowNull: false, defaultValue: 0},
        is_active: {type: Sequelize.DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
        // dl_status: {
        //     type: Sequelize.DataTypes.STRING,
        //     defaultValue: CHUNK_DOWNLOAD_STATUS.NOT_STARTED
        // },
        // ul_status: {
        //     type: Sequelize.DataTypes.STRING,
        //     defaultValue: CHUNK_UPLOAD_STATUS.NOT_STARTED
        // },
        // retry_count: {type: Sequelize.DataTypes.INTEGER, defaultValue: 0},
        // validation_retry_count: {type: Sequelize.DataTypes.INTEGER, defaultValue: 0},
        // txid: {type: Sequelize.DataTypes.STRING, allowNull: true},
        // expires: {type: Sequelize.DataTypes.BIGINT, allowNull: true}
    },
    {
        indexes: [
            // {fields: ['ul_status']},
            // {fields: ['dl_status']}
        ]
    }
);

// NOTE: These hooks are not working when using .update(). Had to hook into ::update() method

// const modificationHook = (m) => {
//     // if (m.changed() && m.changed().includes('ul_status')) {
//     //     markChunkUlStatusInCache(m.id, m.changed().ul_status);
//     //     processQueue(EventTypes.CHUNK_UPLOAD_STATUS_CHANGED, m.id);
//     // }
//     // if (m.changed() && m.changed().includes('dl_status')) {
//     //     processQueue(EventTypes.CHUNK_DOWNLOAD_STATUS_CHANGED, m.id);
//     // }
// };

// Chunk.addHook('afterDestroy', (m) => modificationHook(m));
// Chunk.addHook('afterUpdate', (m) => modificationHook(m));
// Chunk.addHook('afterSave', (m) => modificationHook(m));
// Chunk.addHook('afterUpsert', (m) => modificationHook(m[0]));

module.exports = Assignment;