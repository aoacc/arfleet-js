const axios = require('axios');
const Sequelize = require('sequelize');
const { PLACEMENT_STATUS } = require('../../db/models/Placement');
const { Assignment, Placement, AssignmentChunk, PlacementChunk } = require('../../db/models');

let placementChunkQueue = new BackgroundQueue({
    REBOOT_INTERVAL: 5 * 1000,
    addCandidates: async () => {
        return await PlacementChunk.findAll({
            where: {
                is_encrypted: false,
            }
        });
    },
    processCandidate: async (placement_id) => {

    }
});

module.exports = { placementChunkQueue };