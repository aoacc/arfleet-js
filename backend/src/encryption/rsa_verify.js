#!/bin/env

const fs = require('fs');
const crypto = require('crypto');
const utils = require('../utils');
const config = require('../config');

const BITS = config.rsa_encryption.bits;

function verifyFile(filePath, pubKey, signature) {
    const file = fs.readFileSync(filePath);
    const sigBuffer = Buffer.from(signature, "hex");

    let verified;
    try {
        verified = crypto.publicDecrypt({
            key: pubKey, 
            padding: crypto.constants.RSA_PKCS1_PADDING,
        }, sigBuffer);
    } catch (e) {
        console.error(e);
        return false;
    }

    // compare the decrypted signature to file content
    return verified.toString() == file.toString();
}

process.on('message', async (message) => {
    if (message.command === 'verify') {
        const { filePath, pubKey, signature } = message;

        try {
            const verification = verifyFile(filePath, pubKey, signature);

            // send response to master process
            process.send({
                'command': 'verify',
                'success': verification,
            });
        } catch (e) {
            console.error(e);
            process.send({ 'command': 'verify', 'success': false });
        }
    }
});

module.exports = { verifyFile };