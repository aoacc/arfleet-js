const config = require('../config');
const MODE = process.env.MODE;
const apiServerConfig = config[MODE].apiServer;

const startApi = async() => {
    const express = require('express');
    const app = express();

    // app.use(logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    // app.use(cookieParser());
    // app.use(express.static(path.join(__dirname, 'public')));

    const host = apiServerConfig.host;
    const port = apiServerConfig.port;

    if (MODE === 'client') {
        const { apiStore } = require('../client/apiStore');
        app.post('/store', apiStore);
    }

    if (MODE === 'provider') {
    }

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