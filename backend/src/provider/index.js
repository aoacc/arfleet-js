const utils = require('../utils');

let state = {};

const startProvider = async({ wallet }) => {
    console.log("Starting provider...");

    console.log("Datadir: ", utils.getDatadir());
    console.log("Wallet address: ", await wallet.getAddress());

    const { startPublicServer } = require('./server');
    await startPublicServer();

    const { startProviderRepl } = require('./repl.js');
    await startProviderRepl();
}

module.exports = { startProvider };