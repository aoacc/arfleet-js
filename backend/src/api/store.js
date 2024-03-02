const config = require('../config');
const utils = require('../utils');

const store = (req, res) => {
    const path = req.body.path;
    console.log("Storing path:", path);
    res.send("Queued for storage: " + path);
}

module.exports = {
    store
};