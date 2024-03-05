#!/bin/env

const fs = require('fs');
const crypto = require('crypto');
const utils = require('../utils');
const config = require('../config');

const KEY = Buffer.from(config.aes_encryption.key, 'hex');

function encryptFile(filePath, toFile) {
    const readStream = fs.createReadStream(filePath);
    const writeStream = fs.createWriteStream(toFile);

    const cipher = crypto.createCipher('aes256', KEY);  
    
    readStream.pipe(cipher).pipe(writeStream);
}

process.on('message', async (message) => {
    if (message.command === 'encrypt') {
        const {filePath, chunkId, linkId} = message;

        const suffix = '.'+linkId+'.enc';
        const encryptedPath = filePath + suffix;

        encryptFile(filePath, encryptedPath);

        process.send({
            'command': 'encrypt',
            'success': true,
            'chunkId': chunkId,
            'linkId': linkId,
            'hash': utils.hashFnHex(fs.readFileSync(encryptedPath))
        });
    }
});

module.exports = {encryptFile};