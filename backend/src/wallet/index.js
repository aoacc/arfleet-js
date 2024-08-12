const fs = require('fs');
const arweave = require('../arweave');
const utils = require('../utils');
const config = require('../config');

class Wallet {
    constructor(path) {
        this.walletPath = path;
        this._address = null;
    }

    readPrivateKey() {
        return fs.readFileSync(this.walletPath, 'utf8');
    }

    async getAddress() {
        if (!this._address) {
            this._address = await arweave.wallets.jwkToAddress(JSON.parse(this.readPrivateKey()));
        }
        return this._address;
    }

    async sign(data) {
        const jwk = JSON.parse(this.readPrivateKey());
        const signer = await arweave.wallets.jwkToSigner(jwk);
        return signer.sign(data);
    }
}

const createWallet = async(path) => {
    const key = await arweave.wallets.generate();
    fs.writeFileSync(path, JSON.stringify(key));
};

const initWallet = async() => {
    const walletPath = utils.getDatadir(config.walletPath);

    if (!fs.existsSync(walletPath)) {
        await createWallet(walletPath);
    }

    return new Wallet(walletPath);
};

module.exports = {
    initWallet
}