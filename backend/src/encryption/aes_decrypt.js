#!/bin/env

const fs = require('fs');
const crypto = require('crypto');
const utils = require('../utils');
const config = require('../config');

const KEY = Buffer.from(config.aes_encryption.key, 'hex');

function decryptFile(fileIn, fileOut) {
    const readStream = fs.createReadStream(fileIn);
    const writeStream = fs.createWriteStream(fileOut);

    const decipher = crypto.createDecipher('aes256', KEY);
    
    readStream.pipe(decipher).pipe(writeStream);
}

process.on('message', async (message) => {
    if (message.command === 'decrypt') {
        const {fileIn, fileOut, chunkId} = message;

        try {
            decryptFile(fileIn, fileOut);
        } catch(e) {
            console.log('Error', e);
            throw e;
        }

        process.send({
            'command': 'decrypt',
            'success': true, 
            'chunkId': chunkId, 
            'hashIn': utils.hashFnHex(fs.readFileSync(fileIn)),
            'hashOut': utils.hashFnHex(fs.readFileSync(fileOut))
        });
    }
});

module.exports = {decryptFile};