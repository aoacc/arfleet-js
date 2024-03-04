const Model = require('./base');
const Sequelize = require('sequelize');
const fs = require('fs');
const utils = require('../../utils');
const { encryptFile } = require('../../encryption/rsa_encrypt');
const nodepath = require('path');

class PlacementChunk extends Model {
    constructor(...args) {
        super(...args);
    }

    async encrypt() {
        const { Placement, AssignmentChunk } = require('.');
        const placementChunk = this;
        const placement = await Placement.findOrFail(placementChunk.placement_id);
        const original_chunk_id = placementChunk.original_chunk_id;
        const original_chunk_path = AssignmentChunk.getPath(original_chunk_id);
        const placement_chunk_path = PlacementChunk.getPath(placementChunk.id);

        // create directory if not exists
        utils.mkdirp(nodepath.dirname(placement_chunk_path))

        encryptFile(original_chunk_path, placement_chunk_path, placement.private_key);

        // hash the chunk
        const data = fs.readFileSync(placement_chunk_path, null);
        const hash = utils.hashFn(data);

        placementChunk.is_encrypted = true;
        placementChunk.encrypted_chunk_id = hash;

        await placementChunk.save();
    }

    static getPath(placement_chunk_id) {
        return utils.getDatadir('/placement_chunks/' + placement_chunk_id);
    }
}

PlacementChunk.init(
    {
        id: {type: Sequelize.DataTypes.STRING, unique: true, primaryKey: true},
        placement_id: {type: Sequelize.DataTypes.STRING, allowNull: false},
        is_encrypted: {type: Sequelize.DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
        is_sent: {type: Sequelize.DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
        original_chunk_id: {type: Sequelize.DataTypes.STRING, allowNull: true},
        encrypted_chunk_id: {type: Sequelize.DataTypes.STRING, allowNull: true},
        pos: {type: Sequelize.DataTypes.INTEGER, allowNull: true},
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
            {fields: ['placement_id']},
            {fields: ['is_encrypted']},
            {fields: ['is_sent']},
            {fields: ['original_chunk_id']},
            {fields: ['encrypted_chunk_id']},
            {fields: ['placement_id', 'pos']},
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

module.exports = { PlacementChunk };