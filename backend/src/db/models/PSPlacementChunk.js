const Model = require('./base');
const Sequelize = require('sequelize');
const fs = require('fs');
const utils = require('../../utils');
const nodepath = require('path');

class PSPlacementChunk extends Model {
    constructor(...args) {
        super(...args);
    }

    static getPath(placement_chunk_id) {
        return utils.getDatadir('/ps_placement_chunks/' + placement_chunk_id);
    }

    static getDecryptedPath(placement_chunk_id) {
        return utils.getDatadir('/ps_placement_chunks_decrypted/' + placement_chunk_id);
    }

    static async getData(chunk_id) {
        try {
            const chunk = await PSPlacementChunk.findOneByOrFail('encrypted_chunk_id', chunk_id);
            // console.log('Get data: chunk_id', chunk_id);
            const data = fs.readFileSync(PSPlacementChunk.getPath(chunk.id));
            res.send(data);
        } catch(e) {

            // console.error('Error: Chunk not found: ', chunk_id, e);

            try {
                const chunk = await PSPlacementChunk.findOneByOrFail('original_chunk_id', chunk_id);
                let data = fs.readFileSync(PSPlacementChunk.getDecryptedPath(chunk.id));

                const original_size = chunk.original_size;
                if (original_size) {
                    // cut data
                    data = data.slice(0, original_size);
                }

                return data;
            } catch(e) {

                // 404
                throw new Error('Chunk not found: ' + chunk_id);

            }    
        }
    }
}

PSPlacementChunk.init(
    {
        id: {type: Sequelize.DataTypes.STRING, unique: true, primaryKey: true},
        placement_id: {type: Sequelize.DataTypes.STRING, allowNull: false}, // shouldn't it be p_s_placement_id?
        original_chunk_id: {type: Sequelize.DataTypes.STRING, allowNull: true},
        original_size: {type: Sequelize.DataTypes.BIGINT, allowNull: true},
        encrypted_chunk_id: {type: Sequelize.DataTypes.STRING, allowNull: true},
        is_received: {type: Sequelize.DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
        pos: {type: Sequelize.DataTypes.INTEGER, allowNull: true},
    },
    {
        indexes: [
            {fields: ['placement_id']},
            {fields: ['original_chunk_id']},
            {fields: ['encrypted_chunk_id']},
            {fields: ['placement_id', 'pos']},
            {fields: ['placement_id', 'is_received']},
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

module.exports = { PSPlacementChunk };