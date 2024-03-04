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
            
            app.get('/cmd/ping', (req, res) => {
                res.send('pong');
            });

            app.get('/cmd/placement', (req, res) => {
                // todo: validate here
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