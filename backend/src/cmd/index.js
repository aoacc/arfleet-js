const config = require('../config');
const nodepath = require('path');

const client_store = async (path) => {
    // Call API with the path
    const axios = require('axios');
    
    const API_URL = "http://" + config.client.api_server.host + ":" + config.client.api_server.port;

    try {
        const fullpath = nodepath.resolve(path);
        const response = await axios.post(API_URL + '/store', { path: fullpath });
        
        console.log(response.data);
    } catch (error) {
        console.error("Error connecting to the API:", error.message);
        process.exit(1);
    }
}

module.exports = {
    client_store
};