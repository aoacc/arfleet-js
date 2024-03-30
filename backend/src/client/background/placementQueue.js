const axios = require('axios');
const Sequelize = require('sequelize');
const { PLACEMENT_STATUS } = require('../../db/models/Placement');
const { Assignment, Placement, AssignmentChunk, PlacementChunk } = require('../../db/models');
const { BackgroundQueue } = require('../../utils/backgroundQueue');
const utils = require('../../utils');
const deal = require('../../arweave/deal');
const ao = () => { return require('../../arweave/ao').getAoInstance(); }
const getClientInstance = require('../../client');
const config = require('../../config');
const fs = require('fs');

class ProviderApi {
    constructor(connectionString) {
        this.connectionString = connectionString;
    }

    async cmd(command, data, headers) {
        const url = `${this.connectionString}/cmd/${command}`;
        console.log('Sending request to: ', url);
        const config = {
            headers: {
                'Tempweave-Address': getClientInstance().address,
                'Tempweave-Signature': 'todo' // todo
            }
        };
        const response = await axios.post(url, data, config);
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

        try {
            switch(placement.status) {
                case PLACEMENT_STATUS.CREATED:
                {
                    // Let's try to connect
                    console.log('Trying to connect to provider: ', placement.provider_id);

                    const connectionStrings = placement.provider_connection_strings;
                    const connectionString = placement.getConnectionString();

                    const pApi = new ProviderApi(connectionString);

                    try {
                        const result = await pApi.cmd('ping', {});
                
                        console.log({result});

                        const assignment = await Assignment.findOrFail(placement.assignment_id);

                        if (result === 'pong') {
                            // todo: calculate reward and collateral
                            placement.required_reward = 500; // todo
                            placement.required_collateral = 1000; // todo
                            await placement.save();

                            // available, contact about the placement
                            const placementResult = await pApi.cmd('placement', {
                                placement_id: placement.id,
                                size: assignment.size,
                                chunks: assignment.chunk_count,
                                required_reward: placement.required_reward,
                                required_collateral: placement.required_collateral,
                                provider_id: placement.provider_id
                            });

                            console.log({placementResult});

                            if (placementResult === 'OK') {
                                // mark as approved
                                placement.status = PLACEMENT_STATUS.INITIALIZED;
                                await placement.save();

                                // start the encryption
                                await placement.startEncryption();

                                const originalData = fs.readFileSync(AssignmentChunk.getPath(assignment.id), null);

                                const assignmentChunks = await AssignmentChunk.allBy('assignment_id', assignment.id);
                                for (const assignmentChunk of assignmentChunks) {
                                    // mark as encrypting
                                    PlacementChunk.findByIdOrCreate(placement.id + '_' + assignmentChunk.pos, {
                                        placement_id: placement.id,
                                        is_encrypted: false,
                                        is_sent: false,
                                        original_chunk_id: assignmentChunk.chunk_id,
                                        original_size: originalData.length,
                                        pos: assignmentChunk.pos
                                    });
                                }
                            } else {
                                // mark as failed
                                placement.status = PLACEMENT_STATUS.UNAVAILABLE;
                                await placement.save();
                            }
                        }
                    } catch(e) {
                        // mark as failed
                        console.log('Placement Connection Error: ', e);
                        placement.status = PLACEMENT_STATUS.UNAVAILABLE;
                        await placement.save();
                    }
                    break;
                }

                case PLACEMENT_STATUS.INITIALIZED:
                {
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
                }

                case PLACEMENT_STATUS.ENCRYPTED:
                {
                    const dealDuration = 1 * 365 * 24 * 60 * 60; // todo

                    // create process
                    const createdAtTimestamp = Math.ceil(placement.created_at.getTime() / 1000);
                    const lua_lines = [
                        "State.Provider = '" + placement.provider_id + "'",
                        "State.MerkleRoot = '" + placement.merkle_root + "'",
                        "State.Client = '" + getClientInstance().address + "'",
                        "State.Token = '" + config.defaultToken + "'",
                        "State.RequiredReward = " + placement.required_reward,
                        "State.ReceivedReward = 0",
                        "State.RequiredCollateral = " + placement.required_collateral,
                        "State.ReceivedCollateral = 0",
                        "State.VerificationEveryPeriod = 30", // todo
                        "State.VerificationResponsePeriod = 100", // todo
                        "State.CreatedAt = " + createdAtTimestamp + "",
                        "State.ExpiresAt = " + (createdAtTimestamp + dealDuration) + "",
                        "State.Status = StatusEnum.Created",
                    ];
                    const process_id = await deal.spawnDeal(lua_lines.join("\n"));
                    console.log('Process ID: ', process_id);

                    console.log(await ao().sendAction(process_id, "Eval", "State"));

                    placement.process_id = process_id;
                    placement.status = PLACEMENT_STATUS.PROCESS_SPAWNED;
                    await placement.save();

                    break;
                }

                case PLACEMENT_STATUS.PROCESS_SPAWNED:
                {
                    // fund with the reward

                    console.log('Funding placement: ', placement.id);

                    // change the state before sending the action
                    placement.status = PLACEMENT_STATUS.FUNDED;
                    placement.is_funded = true;
                    await placement.save();
                    
                    try {
                        await ao().sendToken(config.defaultToken, placement.process_id, placement.required_reward);
                        console.log('Token sent');
                    } catch(e) {
                        console.log('Funding Error: ', e);
                        placement.status = PLACEMENT_STATUS.FAILED; // todo: try to take the money out
                        placement.error_was = e.toString();
                        await placement.save();
                    }
                    break;
                }

                case PLACEMENT_STATUS.FUNDED:
                {
                    // Make the provider accept it
                    const pApi = new ProviderApi(placement.getConnectionString());
                    const placementChunks = await PlacementChunk.findAll({
                        where: {
                            placement_id,
                        },
                        order: [
                            ['pos', 'ASC']
                        ]
                    });
                    const chunkHashes = placementChunks.map(c => c.encrypted_chunk_id);
                    
                    const acceptResult = await pApi.cmd('accept', {
                        placement_id: placement.id,
                        merkle_root: placement.merkle_root,
                        chunks: chunkHashes,
                        process_id: placement.process_id
                    });
                    console.log('Accept result: ', acceptResult);

                    if (acceptResult === 'OK') {
                        placement.status = PLACEMENT_STATUS.ACCEPTED;
                        await placement.save();
                    } else {
                        console.error('Accept failed: ', acceptResult);
                        placement.status = PLACEMENT_STATUS.FAILED;
                        placement.error_was = JSON.stringify(acceptResult);
                        await placement.save();
                    }
                    break;
                }

                case PLACEMENT_STATUS.ACCEPTED:
                {
                    const pApi = new ProviderApi(placement.getConnectionString());

                    // Transfer chunks
                    const placementChunks = await PlacementChunk.findAll({
                        where: {
                            placement_id,
                            is_sent: false
                        },
                        order: [
                            ['pos', 'ASC']
                        ]
                    });

                    if (placementChunks.length === 0) {
                        placement.status = PLACEMENT_STATUS.TRANSFERRED;
                        await placement.save();
                    }

                    for (const placementChunk of placementChunks) {
                        console.log('Transfering chunk: ', placementChunk);
                        const placementChunkPath = PlacementChunk.getPath(placementChunk.id);
                        const chunkData = fs.readFileSync(placementChunkPath);
                        const chunkDataB64 = chunkData.toString('base64'); // todo: replace with proper streaming/binary

                        const result = await pApi.cmd('transfer', {
                            placement_id: placement.id,
                            merkle_root: placement.merkle_root,
                            pos: placementChunk.pos,
                            chunk_data: chunkDataB64,
                            hash: placementChunk.encrypted_chunk_id,
                            original_size: placementChunk.original_size
                        });
                        console.log('Transfer result: ', result);

                        if (result === 'OK') {
                            placementChunk.is_sent = true;
                            await placementChunk.save();
                        } else {
                            console.error('Transfer failed: ', result);
                            placement.status = PLACEMENT_STATUS.FAILED;
                            placement.error_was = JSON.stringify(result);
                            await placement.save();
                            break;
                        }
                    }
                    break;
                }

                case PLACEMENT_STATUS.TRANSFERRED:
                {
                    // Make the provider send the collateral
                    const pApi = new ProviderApi(placement.getConnectionString());
                    const result = await pApi.cmd('complete', {
                        placement_id: placement.id,
                        public_key: placement.public_key
                    });

                    if (result === 'OK') {
                        // verify
                        // todo: verify that collateral is there
                        
                        // verify that it is now activated
                        const processState = await ao().getState(placement.process_id);
                        console.log('Process State: ', processState);

                        if (processState.Status !== 'Activated') {
                            // Allow some time to activate
                            const last_update = placement.updated_at.getTime();
                            const WAIT_FOR = 1 * 60;
                            const now = new Date().getTime();
                            if (now - last_update > WAIT_FOR * 1000) {
                                console.error('Process not activated');
                                placement.status = PLACEMENT_STATUS.FAILED;
                                placement.error_was = 'Process not activated';
                                await placement.save();
                            } else {
                                console.log('Waiting for activation');
                                setTimeout(() => {
                                    placementQueue.add(placement.id);
                                }, 5000);
                            }
                        } else {
                            placement.status = PLACEMENT_STATUS.COMPLETED;
                            await placement.save();    
                        }
                        
                    } else {
                        console.error('Complete failed: ', result);
                        placement.status = PLACEMENT_STATUS.FAILED;
                        placement.error_was = JSON.stringify(result);
                        await placement.save();
                    }
                }

                default:
                    // todo
            } // end of switch(placement.status)
        } catch(e) {
            console.error('Error processing placement: ', e);
            placement.status = PLACEMENT_STATUS.FAILED;
            placement.error_was = e.toString();
            await placement.save();
        }
    }
});

module.exports = { placementQueue };