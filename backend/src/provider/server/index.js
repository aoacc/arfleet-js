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
    const client_id = req.headers['Tempweave-Address'];
    const signature = req.headers['Tempweave-Signature'];

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
            app.use(express.urlencoded({ extended: false }));

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

                    // todo: validate size / chunk count

                    // save
                    const existing = await PSPlacement.findOneBy('id', placement_id);
                    if (existing) {
                        res.send('Error: Placement already exists');
                        return;
                    }

                    const placement = await PSPlacement.findByIdOrCreate(placement_id, {
                        client_id,
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
                    if (placement.status !== PS_PLACEMENT_STATUS.CREATED) {
                        res.send('Error: Incorrect placement status');
                        return;
                    }

                    // todo: make sure it's from the same client

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
                    const merkle_root = req.body.merkle_root;
                    const pos = req.body.pos;
                    const chunk_data_b64 = req.body.chunk_data;
                    const chunk_data = Buffer.from(chunk_data_b64, 'base64');
                    const encrypted_chunk_id = req.body.encrypted_chunk_id;

                    // todo: make sure chunk data hashes to the encrypted_chunk_id
                    // todo: make sure it's part of the tree
                    // todo: make sure it's the right position

                    // save it
                    const path = PSPlacementChunk.getPath(placement_id + '_' + pos);
                    await utils.mkdirp(nodepath.dirname(path));
                    fs.writeFileSync(path, chunk_data);

                    const placement_chunk = await PSPlacementChunk.findOneByOrFail('id', placement_id + '_' + pos);
                    // todo: validate it belongs to the client
                    // todo: validate it belongs to the placement
                    placement_chunk.is_received = true;
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

                    // receive public key to decrypt

                    const placement_id = req.body.placement_id;

                    // send collateral and thus activate it

                    const placement = await PSPlacement.findOrFail(placement_id);

                    const public_key = req.body.public_key;

                    placement.public_key = public_key;
                    await placement.save();
                    
                    placement.status = PS_PLACEMENT_STATUS.COMPLETED;
                    await placement.save();

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