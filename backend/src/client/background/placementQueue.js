const axios = require('axios');
const Sequelize = require('sequelize');
const { PLACEMENT_STATUS } = require('../../db/models/Placement');
const { Assignment, Placement, AssignmentChunk, PlacementChunk } = require('../../db/models');
const { BackgroundQueue } = require('./backgroundQueue');
const utils = require('../../utils');

class ProviderApi {
    constructor(connectionString) {
        this.connectionString = connectionString;
    }

    async cmd(command, data) {
        const url = `${this.connectionString}/cmd/${command}`;
        console.log('Sending request to: ', url);
        const response = await axios.post(url, data);
        return response.data;
    }
}

let placementQueue = new BackgroundQueue({
    REBOOT_INTERVAL: 5 * 1000,
    addCandidates: async () => {
        const candidates = await Placement.findAll({
            where: {
                status: {
                    [Sequelize.Op.notIn]: [PLACEMENT_STATUS.UNAVAILABLE, PLACEMENT_STATUS.COMPLETED]
                }
            }
        });
        const ids = candidates.map(c => c.id);
        return ids;
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

                    const assignment = await Assignment.findOrFail(placement.assignment_id);

                    if (result === 'pong') {
                        // available, contact about the placement
                        const placementResult = await pApi.cmd('placement', { size: assignment.size, chunks: assignment.chunk_count });

                        console.log({placementResult});

                        if (placementResult === 'OK') {
                            // mark as approved
                            placement.status = PLACEMENT_STATUS.APPROVED;
                            await placement.save();

                            // start the encryption
                            await placement.startEncryption();

                            const assignmentChunks = await AssignmentChunk.allBy('assignment_id', assignment.id);
                            for (const assignmentChunk of assignmentChunks) {
                                // mark as encrypting
                                PlacementChunk.findByIdOrCreate(placement.id + '_' + assignmentChunk.pos, {
                                    placement_id: placement.id,
                                    is_encrypted: false,
                                    is_sent: false,
                                    original_chunk_id: assignmentChunk.chunk_id,
                                    pos: assignmentChunk.pos
                                });
                            }
                        }
                    }
                } catch(e) {
                    // mark as failed
                    console.log('Placement Connection Error: ', e);
                    placement.status = PLACEMENT_STATUS.UNAVAILABLE;
                    await placement.save();
                }
                break;
            case PLACEMENT_STATUS.APPROVED:
                // check if all chunks are encrypted
                const notEncryptedCount = await PlacementChunk.count({
                    where: {
                        placement_id,
                        is_encrypted: false
                    }
                });
                if (notEncryptedCount === 0) {
                    // get all placement chunks, ordered by pos
                    const placementChunks = await PlacementChunk.findAll({
                        where: {
                            placement_id
                        },
                        order: [
                            ['pos', 'ASC']
                        ]
                    });

                    // calculate merkle tree
                    const chunkHashes = placementChunks.map(c => c.encrypted_chunk_id);
                    const chunkHashesBin = chunkHashes.map(h => Buffer.from(h, 'hex'));
                    const merkleTree = utils.merkle(chunkHashesBin, utils.hashFn);
                    const merkleTreeHex = merkleTree.map(h => h.toString('hex'));
                    const merkleRootHex = merkleTree[merkleTree.length - 1].toString('hex');
                    placement.merkle_root = merkleRootHex;
                    placement.merkle_tree = merkleTreeHex;

                    // mark as encrypted
                    placement.status = PLACEMENT_STATUS.ENCRYPTED;
                    await placement.save();
                }
                break;
            case PLACEMENT_STATUS.ENCRYPTED:
                // create process
                

            default:
                // todo
        } // end of switch(placement.status)
    }
});

module.exports = { placementQueue };