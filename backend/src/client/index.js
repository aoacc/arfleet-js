const config = require('../config');
const utils = require('../utils');

let state = {};

const startClient = async({ wallet }) => {
    state.wallet = wallet;
    
    console.log("startClient");
    console.log("Datadir: ", utils.getDatadir());
    console.log("Wallet address: ", await wallet.getAddress());
}

module.exports = {
    startClient
}