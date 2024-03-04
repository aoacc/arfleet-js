const Model = require('./base');
const Sequelize = require('sequelize');

class Placement extends Model {
    constructor(...args) {
        super(...args);
    }
}

PLACEMENT_STATUS = {
    CREATED: 'created',
    UNAVAILABLE: 'unavailable',
    APPROVED: 'approved',
    ENCRYPTED: 'encrypted',
    PROCESS_CREATED: 'process_created',
    COMPLETED: 'completed',
}

Placement.init(
    {
        id: {type: Sequelize.DataTypes.STRING, unique: true, primaryKey: true},
        provider_id: {type: Sequelize.DataTypes.STRING, allowNull: false},
        provider_connection_strings: {type: Sequelize.DataTypes.JSON, allowNull: true},
        merkle_root: {type: Sequelize.DataTypes.STRING, allowNull: true},
        merkle_tree: {type: Sequelize.DataTypes.JSON, allowNull: true},
        process_id: {type: Sequelize.DataTypes.STRING, allowNull: true},
        redundancy_key: {type: Sequelize.DataTypes.STRING, allowNull: true},
        expires: {type: Sequelize.DataTypes.BIGINT, allowNull: true},
        status: {
            type: Sequelize.DataTypes.STRING,
            defaultValue: PLACEMENT_STATUS.CREATED
        }
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

module.exports = { Placement, PLACEMENT_STATUS };
