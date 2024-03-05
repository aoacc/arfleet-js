const axios = require('axios');
const Sequelize = require('sequelize');
const { PLACEMENT_STATUS } = require('../../db/models/Placement');
const { Assignment, Placement, AssignmentChunk, PlacementChunk } = require('../../db/models');
const { BackgroundQueue } = require('./backgroundQueue');
const utils = require('../../utils');
const deal = require('../../arweave/deal');
const ao = () => { return require('../../arweave/ao').getAoInstance(); }
const client = require('../../client');
const config = require('../../config');

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
                const createdAtTimestamp = placement.created_at.getTime();
                const lua_lines = [
                    "State.Provider = '" + placement.provider_id + "'",
                    "State.MerkleRoot = '" + placement.merkle_root + "'",
                    "State.Client = '" + client().address + "'",
                    "State.CreatedAt = " + createdAtTimestamp + "",
                ];
                const process_id = await deal.spawnDeal(lua_lines.join("\n"));
                console.log('Process ID: ', process_id);

                console.log(await ao().sendAction(process_id, "Eval", "State"));

                placement.process_id = process_id;
                placement.status = PLACEMENT_STATUS.PROCESS_CREATED;
                await placement.save();

                break;
            case PLACEMENT_STATUS.PROCESS_CREATED:
                // fund
                // aos> Send({ Target = ao.id, Action = "Transfer", Recipient = Trinity, Quantity = "1000"})

                // change the state before sending the action
                placement.status = PLACEMENT_STATUS.FUNDED;
                placement.is_funded = true;
                await placement.save();
                
                try {
                    const tokenSend = await ao().sendActionExtra(config.defaultToken, "Transfer", "1000", { Recipient: placement.process_id });
                    console.log('Token send: ', tokenSend);
                } catch(e) {
                    console.log('Funding Error: ', e);
                    placement.status = PLACEMENT_STATUS.FAILED; // todo: try to take the money out
                    await placement.save();
                }
                break;
                
            default:
                // todo
        } // end of switch(placement.status)
    }
});

module.exports = { placementQueue };