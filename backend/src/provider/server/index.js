const config = require('../../config');
const MODE = process.env.MODE;
const apiServerConfig = config[MODE].apiServer;
const publicServerConfig = config[MODE].publicServer;
const utils = require('../../utils');

let state = {};

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
                res.send('pong');
            });

            app.post('/cmd/placement', (req, res) => {
                // todo: validate here
                console.log('Received placement: ', req.body);
                res.send('OK');
            });

            app.post('/cmd/accept', (req, res) => {
                // todo: validate everything about the deal process here

                // process
                // payment
                // merkle tree

                // you get:
                // - placement_id
                // - merkle_root
                // - chunks
                // - process_id

                console.log('Accepting placement: ', req.body);
                res.send('OK');
            });

            app.post('/cmd/transfer', (req, res) => {
                const placement_id = req.body.placement_id;
                const merkle_root = req.body.merkle_root;
                const pos = req.body.pos;
                const chunk_data_b64 = req.body.chunk_data;
                const chunk_data = Buffer.from(chunk_data_b64, 'base64');
                const encrypted_chunk_id = req.body.encrypted_chunk_id;

                // todo: make sure chunk data hashes to the encrypted_chunk_id
                // todo: make sure it's part of the tree
                // todo: make sure it's the right position

                // todo: save it

                console.log('Received chunk: ', req.body);
                res.send('OK');
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