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

        const { startProviderRepl } = require('./repl.js');
        await startProviderRepl(this);
    }

    async getCapacity() {
        // todo: return remaining
        return config.provider.defaultStorageCapacity;
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