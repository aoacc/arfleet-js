const config = require('../config');
const utils = require('../utils');

const startClient = () => {
    console.log("startClient");
    console.log("Datadir: ", utils.getDatadir());
}

module.exports = {
    startClient
}