const utils = require('../utils');
const config = require('../config');
const { getAoInstance } = require('../arweave/ao');

class Provider {
    constructor({ wallet }) {
        this.wallet = wallet;
        this.start();
    }

    async start() {
        this.address = await this.wallet.getAddress();

        console.log("Starting provider...");
        console.log("Datadir: ", utils.getDatadir());
        console.log("Wallet address: ", this.address);

        this.ao = getAoInstance({ wallet: this.wallet });

        const { startPublicServer } = require('./server');
        const result = await startPublicServer();
        this.externalIP = result.externalIP;
        this.connectionStrings = result.connectionStrings;

        const challengesQueue = require('./background/challengesQueue.js');
        challengesQueue; // start the queue

        const decryptChunksQueue = require('./background/decryptChunksQueue.js');
        decryptChunksQueue; // start the queue

        const { startProviderRepl } = require('./repl.js');
        await startProviderRepl(this);
    }

    async getCapacityRemaining() {
        return Math.max(0, this.getCapacityLimit() - this.getCapacityUsed());
    }

    async getCapacityLimit() {
        return config.provider.defaultStorageCapacity; // todo: allow user to adjust
    }

    async getCapacityUsed() {
        return 0; // todo
    }

    async getStoragePriceDeal() {
        return config.provider.defaultStoragePriceDeal; // todo: allow user to adjust
    }

    async getStoragePriceUploadKBSec() {
        return config.provider.defaultStoragePriceUploadKBSec; // todo: allow user to adjust
    }

    async getMinChallengeDuration() {
        return config.provider.defaultMinChallengeDuration; // todo: allow user to adjust
    }

    async getMinStorageDuration() {
        return config.provider.defaultMinStorageDuration; // todo: allow user to adjust
    }

    async getMaxStorageDuration() {
        return config.provider.defaultMaxStorageDuration; // todo: allow user to adjust
    }
}

let providerInstance;

function getProviderInstance(initialState = null) {
    if(!providerInstance) {
        if (!initialState) throw new Error("Provider is not initialized with a state");
        providerInstance = new Provider(initialState);
    }
    
    return providerInstance;
}

module.exports = getProviderInstance;