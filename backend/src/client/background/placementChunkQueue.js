const axios = require('axios');
const Sequelize = require('sequelize');
const { PLACEMENT_STATUS } = require('../../db/models/Placement');
const { Assignment, Placement, AssignmentChunk, PlacementChunk } = require('../../db/models');
const { BackgroundQueue } = require('../../utils/backgroundQueue');

let placementChunkQueue = new BackgroundQueue({
    REBOOT_INTERVAL: 5 * 1000,
    addCandidates: async () => {
        const candidates = await PlacementChunk.findAll({
            where: {
                is_encrypted: false,
            }
        });
        const ids = candidates.map(c => c.id);
        return ids;
    },
    processCandidate: async (placement_chunk_id) => {
        const placementChunk = await PlacementChunk.findOrFail(placement_chunk_id);
        if (placementChunk.is_encrypted) {
            return;
        }

        console.log('Encrypting placement chunk: ', placementChunk.id);
        await placementChunk.encrypt();

        // Try to see if it's fully encrypted
        const placement_id = placementChunk.placement_id;
        const nonEncryptedChunks = await PlacementChunk.count({
            where: {
                placement_id,
                is_encrypted: false,
            }
        });
        if (nonEncryptedChunks === 0) {
            setImmediate(async () => {
                const { placementQueue } = require('./placementQueue');
                placementQueue.add(placement_id);
            });
        }
    }
}, 'placementChunkQueue');

module.exports = { placementChunkQueue };
