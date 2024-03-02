const config = require('../config');
const utils = require('../utils');
const deployer = require('../client/deployer');

const store = async(req, res) => {
    const path = req.body.path;
    console.log("Storing path:", path);

    await deployer.store(path);

    res.send("Queued for storage: " + path);
}

module.exports = {
    store
};