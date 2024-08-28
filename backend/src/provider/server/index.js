const config = require('../../config');
const { PSPlacement, PSPlacementChunk } = require('../../db/models');
const { PS_PLACEMENT_STATUS } = require('../../db/models/PSPlacement');
const MODE = process.env.MODE;
const apiServerConfig = config[MODE].apiServer;
const publicServerConfig = config[MODE].publicServer;
const utils = require('../../utils');
const nodepath = require('path');
const fs = require('fs');
const mime = require('mime-types');

let state = {};

const exploreChunk = async (chunk_id, data, filename, req, res) => {
    if (data.toString().startsWith(config.directoryPrologue)) {
        const dir = JSON.parse(data.toString().slice(config.directoryPrologue.length));
        if (dir.type === 'directory') {
            let html = `
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
                    .container { max-width: 1000px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    h1,h2,h3,h4 { color: #333; margin-top: 20px; }
                    .monospace { font-family: monospace; font-weight: normal; }
                    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
                    th { background-color: #f2f2f2; color: #333; font-weight: bold; }
                    tr:hover { background-color: #f5f5f5; }
                    a { color: #0066cc; text-decoration: none; }
                    a:hover { text-decoration: underline; }
                    .back-button { display: inline-block; padding: 8px 16px; background-color: #e0e0e0; color: #333; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; margin-bottom: 20px; }
                    .back-button:hover { background-color: #d0d0d0; }
                    .file-icon { margin-right: 5px; }
                    .logo { max-width: 180px; }
                    .header-stripe {
                        background: linear-gradient(to right, rgba(224, 224, 224, 100), rgba(224, 224, 224, 0));
                        margin: -20px -20px 20px -20px;
                        padding: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header-stripe">
                        <img src="/public/arfleet-logo.png" alt="ArFleet Logo" class="logo">
                    </div>
                    <button onclick="history.back()" class="back-button">← Back</button>
                    <h2>Index of <span class="monospace">${chunk_id}/</span></h2>
                    <table>
                        <tr>
                            <th>Name</th>
                            <th style="text-align: right">Size</th>
                            <th>Hash</th>
                        </tr>`;

            for (const [name, info] of Object.entries(dir.files)) {
                const urlSafeName = encodeURIComponent(name);
                const isDirectory = (info.type === 'dir' || info.type === 'dirptr');
                const icon = isDirectory ? '📁' : '📄';
                html += `
                    <tr>
                        <td><span class="file-icon">${icon}</span><a href="/explore/${info.hash}?filename=${urlSafeName}">${name}</a></td>
                        <td style="text-align: right">${info.size} bytes</td>
                        <td style="font-family: monospace;">${info.hash}</td>
                    </tr>`;
            }

            html += `
                </table>
            </body>
            </html>`;

            res.setHeader('Content-Type', 'text/html');
            res.send(html);
        } else {
            res.send('Not a directory');
        }
    } else if (data.toString().startsWith(config.chunkinfoPrologue)) {
        const chunkInfo = JSON.parse(data.toString().slice(config.chunkinfoPrologue.length));
        const chunks = chunkInfo.chunks;
        const chunkData = await Promise.all(chunks.map(chunk => PSPlacementChunk.getData(chunk)));
        const fileData = Buffer.concat(chunkData);
        // todo: verify the final hash against the chunkinfo!

        return await exploreChunk(chunk_id, fileData, filename, req, res);
    } else {
        let contentType = 'application/octet-stream'; // Default content type
        if (filename) contentType = mime.lookup(filename) || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);

        return data;
    }
}

const validateSignature = (req) => {
    const headers = utils.normalizeHeaders(req.headers);
    const client_id = headers['arfleet-address'];
    const signature = headers['arfleet-signature'];

    // console.log('Received signature: ', signature);

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
            const bodyParser = require('body-parser');
            const app = express();

            // app.use(express.json());
            app.use(express.json({ limit: '10mb' }));
            app.use(express.urlencoded({ limit: '10mb' }));

            const host = publicServerConfig.host;
            const port = publicServerConfig.port;

            app.use('/public', express.static(utils.getPublicDir()));

            app.get('/', (req, res) => {
                res.send('Hello from Provider (public)!')
            });

            app.post('/cmd/ping', (req, res) => {
                console.log("calling /cmd/ping");
                try {
                    const client_id = validateSignature(req);
                    res.send('pong');
                } catch(e) {
                    console.log('Error: ', e);
                    res.send('Error');
                }
            });

            app.post('/cmd/placement', async(req, res) => {
                console.log("calling /cmd/placement");
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
                console.log("calling /cmd/accept");
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

                    // todo: better place it in a file, not in db

                    console.log('placement:', placement);
                    console.log('chunksHex:', chunksHex);
                    console.log('chunks:', chunks);
                    console.log('merkle_tree:', merkle_tree);
                    console.log('merkle_tree_hex:', merkle_tree_hex);
                    console.log('our_merkle_root:', our_merkle_root);
                    console.log('received merkle_root:', placement.merkle_root);

                    placement.merkle_tree_full = utils.merkleFullBinToHex(utils.merkleFull(chunks, utils.hashFn));
                    await placement.save();

                    console.log('Hashes: ', chunksHex);
                    console.log('Merkle root: ', placement.merkle_root);
                    console.log('Merkle tree flat: ', merkle_tree_hex);
                    console.log('Merkle tree: ', utils.printTree(placement.merkle_tree_full));
                    // process.exit(0);

                    // Get process state
                    const { getAoInstance } = require('../../arweave/ao');
                    const state = await getAoInstance().getState(placement.process_id);
                    console.log('Process state: ', state);

                    if (!state) return res.send('Error: Process not found');

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
                console.log("calling /cmd/transfer");
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

                    const original_size = req.body.original_size;

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
                    placement_chunk.original_size = original_size;
                    await placement_chunk.save();

                    console.log('Received chunk: ', req.body);
                    res.send('OK');
                } catch(e) {
                    console.log('Error: ', e);
                    res.send('Error');
                }
            });

            app.post('/cmd/complete', async(req, res) => {
                console.log("calling /cmd/complete");
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
                    placement.is_collaterized = true;
                    await placement.save();

                    // Then, send the collateral
                    const collateralRequired = await placement.getCollateralLeftToSend();
                    if (collateralRequired > 0) {
                        const { getAoInstance } = require('../../arweave/ao');
                        try {
                            await (getAoInstance()).sendToken(config.defaultToken, placement.process_id, collateralRequired);
                            // todo: placement.txid = txid;
                            await placement.save();

                            //wait some time for the token process to submit the credit notice
                            await new Promise(r => setTimeout(r, 5000));

                            let state;
                            let waitTime = 500;
                            for (let i = 0; i < 5; i++) {
                                try {
                                    state = await getAoInstance().getState(placement.process_id);
                                    console.log('Process state: ', state);
                                    if (state.Status === 'Activated') {
                                        break;
                                    }
                                } catch (e) {
                                    // Ignore
                                }
                                await new Promise(r => setTimeout(r, waitTime));
                                waitTime *= 2;
                            }

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

            app.get('/download/:chunk_id', async(req, res) => {
                console.log("calling /download/:chunk_id");
                try {
                    // const client_id = validateSignature(req);
                    // const chunk_id = req.body.chunk_id;
                    const chunk_id = req.params.chunk_id;
                    const data = await PSPlacementChunk.getData(chunk_id);

                    // if (data.toString().startsWith(config.directoryPrologue)) {
                    //     res.setHeader('Content-Type', 'text/plain');
                    //     res.send(data.toString('utf8').slice(config.directoryPrologue.length));
                    // } else {
                        res.send(data);
                    // }
                } catch(e) {
                    console.log('Error: ', e);
                    res.send('Error');
                }
            });
            app.get('/ranged_explore/:chunk_id', async (req, res) => {
                try {
                    const chunk_id = req.params.chunk_id;
                    const filename = req.query.filename; // Get the filename from the query parameter
                    const clientIp = req.ip || req.connection.remoteAddress;
                    console.log(`GET /ranged_explore/${chunk_id} requested from ${clientIp} with filename: ${filename}`);

                    const data = await PSPlacementChunk.getData(chunk_id);

                    // Check for the Range header
                    const range = req.headers.range;
                    if (range) {
                        const d = await exploreChunk(chunk_id, data, filename, req, res);
                        const positions = range.replace(/bytes=/, "").split("-");
                        const start = parseInt(positions[0], 10);
                        const end = positions[1] ? parseInt(positions[1], 10) : d.length - 1;
                        const chunkSize = (end - start) + 1;
                        const fileChunk = d.subarray(start, end + 1);

                        res.status(206).set({
                            'Content-Range': `bytes ${start}-${end}/${d.length}`,
                            'Accept-Ranges': 'bytes',
                            'Content-Length': chunkSize,
                            'Content-Type': mime.lookup(filename) || 'application/octet-stream'
                        });

                        return res.send(fileChunk);
                    } else {
                        const d = await exploreChunk(chunk_id, data, filename, req, res);
                        res.send(d);

                    }
                } catch (e) {
                    console.error('Error in /ranged_explore/:chunk_id:', e);
                    res.status(500).send('Error: ' + e.message);
                }
            });
            app.get('/explore/:chunk_id', async(req, res) => {
                try {
                    const chunk_id = req.params.chunk_id;
                    const filename = req.query.filename; // Get the filename from the query parameter
                    const clientIp = req.ip || req.connection.remoteAddress;
                    console.log(`GET /explore/${chunk_id} requested from ${clientIp} with filename: ${filename}`);

                    const data = await PSPlacementChunk.getData(chunk_id);
                    res.send(await exploreChunk(chunk_id, data, filename, req, res));
                } catch(e) {
                    console.error('Error in /explore/:chunk_id:', e);
                    res.status(500).send('Error: ' + e.message);
                }
            });
            app.head('/explore/:chunk_id', async (req, res) => {
                try {
                    const chunk_id = req.params.chunk_id;
                    const filename = req.query.filename; // Get the filename from the query parameter
                    const clientIp = req.ip || req.socket.remoteAddress;
                    console.log(`HEAD /explore/${chunk_id} requested from ${clientIp} with filename: ${filename}`);
                    const data = await PSPlacementChunk.getData(chunk_id);

                    if (data.toString().startsWith(config.directoryPrologue)) {
                        const dir = JSON.parse(data.toString().slice(config.directoryPrologue.length));
                        if (dir.type === 'directory') {
                            res.setHeader('Content-Type', 'text/html');
                            res.setHeader('Content-Length', Buffer.byteLength(data));
                            res.end();
                        } else {
                            res.setHeader('Content-Type', 'text/plain');
                            res.setHeader('Content-Length', Buffer.byteLength('Not a directory'));
                            res.end();
                        }
                    } else if (data.toString().startsWith(config.chunkinfoPrologue)) {
                        const chunkInfo = JSON.parse(data.toString().slice(config.chunkinfoPrologue.length));
                        const chunks = chunkInfo.chunks;
                        const chunkData = await Promise.all(chunks.map(chunk => PSPlacementChunk.getData(chunk)));
                        const fileData = Buffer.concat(chunkData);

                        res.setHeader('Content-Type', 'application/octet-stream');
                        res.setHeader('Content-Length', Buffer.byteLength(fileData));
                        res.end();
                    } else {
                        let contentType = 'application/octet-stream'; // Default content type
                        if (filename) contentType = mime.lookup(filename) || 'application/octet-stream';

                        res.setHeader('Content-Type', contentType);
                        res.setHeader('Content-Length', Buffer.byteLength(data));
                        res.end();
                    }
                } catch (e) {
                    console.error('Error in /explore/:chunk_id (HEAD):', e);
                    res.status(500).end();
                }
            });

            app.get('/announcement', async(req, res) => {
                console.log("calling /announcement");
                const provider = require('../../provider')();
                res.send({
                    announcement: {
                        ProviderId: provider.address,
                        ConnectionStrings: `http://localhost:${port}`,
                        StorageCapacity: await provider.getCapacityRemaining(),
                        MinStorageDuration: await provider.getMinStorageDuration(),
                        MaxStorageDuration: await provider.getMaxStorageDuration(),
                        MinChallengeDuration: await provider.getMinChallengeDuration(),
                        StoragePriceDeal: await provider.getStoragePriceDeal(),
                        StoragePriceUploadKBSec: await provider.getStoragePriceUploadKBSec(),
                    }
                });
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
