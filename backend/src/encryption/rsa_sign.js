#!/bin/env

const fs = require('fs');
const crypto = require('crypto');
const utils = require('../utils');
const config = require('../config');

const BITS = config.rsa_encryption.bits;

function signFile(filePath, privKey) {
    const file = fs.readFileSync(filePath);
    const fileSignature = crypto.privateEncrypt({
        key: privKey, 
        padding: crypto.constants.RSA_PKCS1_PADDING,
    }, file);
    
    return fileSignature.toString('hex');
}

process.on('message', async (message) => {
    if (message.command === 'sign') {
        const { filePath, privKey } = message;

        try {
            const signature = signFile(filePath, privKey);

            // send response to master process
            process.send({ 'command': 'sign', 'success': true, 'signature': signature });
        } catch (e) {
            console.error(e);
            process.send({ 'command': 'sign', 'success': false });
        }
    }
});

module.exports = { signFile };