const axios = require('axios');
const Sequelize = require('sequelize');
const { PLACEMENT_STATUS } = require('../../db/models/Placement');
const { Assignment, Placement, AssignmentChunkMap, PlacementChunkMap } = require('../../db/models');

let placementQueue = new BackgroundQueue({
    REBOOT_INTERVAL: 5 * 1000,
    addCandidates: async () => {
        return await Placement.findAll({
            where: {
                status: {
                    [Sequelize.Op.notIn]: [PLACEMENT_STATUS.UNAVAILABLE, PLACEMENT_STATUS.COMPLETED]
                }
            }
        });
    },
    processCandidate: async (placement_id) => {
        console.log('Processing placement: ', placement_id);

        const placement = await Placement.findOrFail(placement_id);
        console.log('Placement: ', placement);

        switch(placement.status) {
            case PLACEMENT_STATUS.CREATED:
                // Let's try to connect
                console.log('Trying to connect to provider: ', placement.provider_id);

                const connectionStrings = placement.provider_connection_strings;
                const connectionString = connectionStrings[0]; // todo: go through all in the future/certain %

                const pApi = new ProviderApi(connectionString);

                try {
                    const result = await pApi.cmd('ping', {});
            
                    console.log({result});

                    const assignment = await Assignment.findOrFail(placement.id);

                    if (result === 'pong') {
                        // available, contact about the placement
                        const placementResult = await pApi.cmd('placement', { size: assignment.size, chunks: assignment.chunk_count });

                        console.log({placementResult});

                        if (placementResult === 'OK') {
                            // mark as approved
                            placement.status = PLACEMENT_STATUS.APPROVED;
                            await placement.save();

                            // start the encryption
                            const assignmentChunks = await AssignmentChunkMap.allBy('assignment_id', assignment.id);
                            for (const assignmentChunk of assignmentChunks) {
                                // mark as encrypting
                                const placementChunk = await PlacementChunkMap.findByIdOrCreate(placement.id + '_' + assignmentChunk.pos, {
                                    placement_id: placement.id,
                                    is_encrypted: false,
                                    is_sent: false,
                                    original_chunk_id: assignmentChunk.chunk_id,
                                    pos: assignmentChunk.pos
                                });
                            }
                            // -------MARKER---------
                        }
                    }
                } catch(e) {
                    // mark as failed
                    placement.status = PLACEMENT_STATUS.UNAVAILABLE;
                    await placement.save();
                }
                break;
            case PLACEMENT_STATUS.APPROVED:
                // check if all chunks are encrypted
                const notEncryptedCount = await PlacementChunkMap.count({
                    where: {
                        placement_id,
                        is_encrypted: false
                    }
                });
                if (notEncryptedCount === 0) {
                    // mark as encrypted
                    placement.status = PLACEMENT_STATUS.ENCRYPTED;
                    await placement.save();
                }
                break;
            default:
                // todo
        } // end of switch(placement.status)
    }
});

module.exports = { placementQueue };