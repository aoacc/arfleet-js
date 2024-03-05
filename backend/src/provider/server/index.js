const config = require('../../config');
const { PSPlacement, PSPlacementChunk } = require('../../db/models');
const { PS_PLACEMENT_STATUS } = require('../../db/models/PSPlacement');
const MODE = process.env.MODE;
const apiServerConfig = config[MODE].apiServer;
const publicServerConfig = config[MODE].publicServer;
const utils = require('../../utils');
const nodepath = require('path');
const fs = require('fs');

let state = {};

const validateSignature = (req) => {
    const headers = utils.normalizeHeaders(req.headers);
    const client_id = headers['tempweave-address'];
    const signature = headers['tempweave-signature'];

    console.log('Received signature: ', signature);

    if (!client_id || !signature) {
        throw new Error('Invalid signature');
    }

    const data = req.body;
    // const hash = utils.hashFnHex(Buffer.from(JSON.stringify(data)));
    // todo

    return client_id;
};

const startPublicServer = async() => {
    return new Promise((resolve, reject) => {            
        try {
            const express = require('express');
            const app = express();

            app.use(express.json());
            // app.use(express.urlencoded({ extended: false }));

            const host = publicServerConfig.host;
            const port = publicServerConfig.port;

            app.get('/', (req, res) => {
                res.send('Hello World!')
            });
            
            app.post('/cmd/ping', (req, res) => {
                try {
                    const client_id = validateSignature(req);
                    res.send('pong');
                } catch(e) {
                    console.log('Error: ', e);
                    res.send('Error');
                }
            });

            app.post('/cmd/placement', async(req, res) => {
                try {
                    const client_id = validateSignature(req);

                    // todo: validate here
                    console.log('Received placement: ', req.body);
                    const placement_id = req.body.placement_id;
                    const size = req.body.size;
                    const chunks = req.body.chunks;
                    const provider_id = req.body.provider_id;

                    const provider = require('../../provider')();
                    console.log(provider.address);
                    if (!provider_id || provider_id !== provider.address) {
                        console.error('Error: Provider id mismatch');
                        res.send('Error: Provider id mismatch');
                        return;
                    }

                    const required_reward = req.body.required_reward;
                    const required_collateral = req.body.required_collateral;

                    // todo: validate size / chunk count that you can afford that much
                    // todo: validate that placement_id is in correct format, and all other fields

                    // save
                    const existing = await PSPlacement.findOneBy('id', placement_id);
                    if (existing) {
                        res.send('Error: Placement already exists');
                        return;
                    }

                    const placement = await PSPlacement.findByIdOrCreate(placement_id, {
                        client_id,
                        status: PS_PLACEMENT_STATUS.CREATED,
                        // todo: reported_size
                        // todo: reported chunk count
                    });

                    res.send('OK');
                } catch(e) {
                    console.log('Error: ', e);
                    res.send('Error');
                }
            });

            app.post('/cmd/accept', async(req, res) => {
                try {
                    const client_id = validateSignature(req);

                    // todo: validate everything about the deal process here

                    // process
                    // - wasm
                    // - memory
                    // - variables
                    // - owner
                    // payment
                    // merkle tree

                    // you get:
                    // - placement_id
                    // - merkle_root
                    // - chunks
                    // - process_id

                    const placement = await PSPlacement.findOneByOrFail('id', req.body.placement_id);
                    placement.validateOwnership(client_id);
                    placement.validateStatus(PS_PLACEMENT_STATUS.CREATED);

                    placement.process_id = req.body.process_id;
                    placement.merkle_root = req.body.merkle_root;
                    const chunksHex = req.body.chunks;
                    const chunks = chunksHex.map(c => Buffer.from(c, 'hex'));
                    const merkle_tree = utils.merkle(chunks, utils.hashFn);
                    const merkle_tree_hex = merkle_tree.map(c => c.toString('hex'));
                    const our_merkle_root = merkle_tree_hex[merkle_tree_hex.length-1];
                    if (our_merkle_root !== placement.merkle_root) {
                        res.send('Error: Merkle root mismatch: ours[' + our_merkle_root + '] vs received[' + placement.merkle_root + ']');
                        return;
                    }

                    // Get process state
                    const { getAoInstance } = require('../../arweave/ao');
                    const state = await getAoInstance().getState(placement.process_id);
                    console.log('Process state: ', state);

                    if (state["Client"] !== client_id) return res.send('Error: Client mismatch');
                    // todo: if (state["Provider"] !== provider.address) return res.send('Error: Provider mismatch');
                    if (state["Status"] !== "Created") return res.send('Error: Status mismatch');

                    placement.status = PS_PLACEMENT_STATUS.ACCEPTED;
                    await placement.save();

                    // Now create chunks
                    for (let pos = 0; pos < chunks.length; pos++) {
                        const chunk_id = chunks[pos];
                        const placement_chunk = await PSPlacementChunk.findByIdOrCreate(placement.id + '_' + pos, {
                            placement_id: placement.id,
                            encrypted_chunk_id: chunk_id,
                            pos
                        });
                    }

                    console.log('Accepting placement: ', req.body);
                    res.send('OK');
                } catch(e) {
                    console.log('Error: ', e);
                    res.send('Error');
                }
            });

            app.post('/cmd/transfer', async(req, res) => {
                try {
                    const client_id = validateSignature(req);

                    const placement_id = req.body.placement_id;
                    const placement = await PSPlacement.findOneByOrFail('id', placement_id);
                    placement.validateOwnership(client_id);
                    placement.validateStatus(PS_PLACEMENT_STATUS.ACCEPTED);

                    const merkle_root = req.body.merkle_root;
                    const pos = req.body.pos;
                    const chunk_data_b64 = req.body.chunk_data;
                    const chunk_data = Buffer.from(chunk_data_b64, 'base64');
                    const hash = req.body.hash;

                    const chunk_data_hashed = utils.hashFnHex(chunk_data);
                    if (chunk_data_hashed !== hash) {
                        res.send('Error: Chunk data hash mismatch: ours[' + chunk_data_hashed + '] vs received[' + hash + ']');
                        return;
                    }

                    // todo: make sure it's part of the tree
                    // todo: make sure it's the right position

                    // save it
                    const path = PSPlacementChunk.getPath(placement_id + '_' + pos);
                    await utils.mkdirp(nodepath.dirname(path));
                    fs.writeFileSync(path, chunk_data);

                    const placement_chunk = await PSPlacementChunk.findOneByOrFail('id', placement_id + '_' + pos);
                    if (placement_chunk.placement_id !== placement_id) {
                        res.send('Error: Placement id mismatch');
                        return;
                    }
                    
                    placement_chunk.is_received = true;
                    placement_chunk.encrypted_chunk_id = hash;
                    await placement_chunk.save();

                    console.log('Received chunk: ', req.body);
                    res.send('OK');
                } catch(e) {
                    console.log('Error: ', e);
                    res.send('Error');
                }
            });

            app.post('/cmd/complete', async(req, res) => {
                try {
                    const client_id = validateSignature(req);

                    const placement_id = req.body.placement_id;
                    const placement = await PSPlacement.findOrFail(placement_id);
                    placement.validateOwnership(client_id);

                    if (placement.status === PS_PLACEMENT_STATUS.COMPLETED) {
                        // Already activated
                        res.send('OK');
                        return;
                    }

                    placement.validateStatus(PS_PLACEMENT_STATUS.ACCEPTED);

                    const public_key = req.body.public_key;
                    placement.public_key = public_key;
                    await placement.save();

                    // --- Send collateral and thus activate it ---
                    
                    // First, mark it as funded to avoid double spending
                    placement.is_funded = true;
                    await placement.save();

                    // Then, send the collateral
                    const collateralRequired = await placement.getCollateralLeftToSend();
                    if (collateralRequired > 0) {
                        const { getAoInstance } = require('../../arweave/ao');
                        try {
                            await (getAoInstance()).sendToken(config.defaultToken, placement.process_id, collateralRequired);
                            // todo: placement.txid = txid;
                            await placement.save();

                            const state = await getAoInstance().getState(placement.process_id);
                            console.log('Process state: ', state);
                            
                            const next_verification_timestamp = state["NextVerification"];
                            placement.next_challenge = new Date(next_verification_timestamp * 1000);
                            await placement.save();
                        } catch(e) {
                            placement.status = PS_PLACEMENT_STATUS.FAILED;
                            await placement.save();

                            console.log('Error: ', e);
                            res.send('Error');
                        }
                    }

                    // ---

                    placement.status = PS_PLACEMENT_STATUS.COMPLETED;
                    await placement.save();

                    res.send('OK');

                } catch(e) {
                    console.log('Error: ', e);
                    res.send('Error');
                }
            });

            app.post('/cmd/download', (req, res) => {
                try {
                    const client_id = validateSignature(req);

                    // todo
                } catch(e) {
                    console.log('Error: ', e);
                    res.send('Error');
                }
            });

            app.listen(port, host, async() => {
                state.externalIP = await utils.myExternalIP();
                state.connectionStrings = `http://${state.externalIP}:${port}`;

                console.log(`Public server app listening on http://${host}:${port}`);
                console.log(`Public URLs are: ${state.connectionStrings}`);

                resolve(state);
            });
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { startPublicServer };