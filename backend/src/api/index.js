const config = require('../config');
const MODE = process.env.MODE;
const apiServerConfig = config[MODE].api_server;

const startApi = async() => {
    const express = require('express');
    const app = express();
    
    const host = apiServerConfig.host;
    const port = apiServerConfig.port;

    app.get('/', (req, res) => {
        res.send('Hello World!')
    });

    app.listen(port, host, () => {
        console.log(`API app listening on http://${host}:${port}`);
    });
}

module.exports = {
    startApi
}