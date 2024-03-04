const config = require('../config');
const crypto = require('crypto');

const generateKeyPair = async() => {
    return new Promise((resolve, reject) => {
        crypto.generateKeyPair('rsa', {
            modulusLength: config.rsa_encryption.bits,
            // publicExponent: PUBEXP, // todo: supposedly 3 makes it faster for decryption than encryption
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
                // cipher: 'aes-256-cbc',
                // passphrase: 'top secret'
            }
        }, async(err, publicKey, privateKey) => {
            if (err) reject('Error: '+err);
    
            resolve({public_key: publicKey, private_key: privateKey});
        });
    })
}

module.exports = { generateKeyPair };
