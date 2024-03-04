const axios = require('axios');
const Sequelize = require('sequelize');
const { PLACEMENT_STATUS } = require('../../db/models/Placement');
const { Assignment, Placement, AssignmentChunkMap, PlacementChunkMap } = require('../../db/models');

let placementChunkQueue = new BackgroundQueue({
    REBOOT_INTERVAL: 5 * 1000,
    addCandidates: async () => {
        return await PlacementChunkMap.findAll({
            where: {
                is_encrypted: false,
            }
        });
    },
    processCandidate: async (placement_id) => {

    }
});

module.exports = { placementChunkQueue };