const config = require('../config');
const utils = require('../utils');
const providerAnnouncements = require('./background/providerAnnouncements');
const { getAoInstance } = require('../arweave/ao');
const { Assignment, Placement } = require('../db/models');

let state = {};

class Client {
    constructor({ wallet }) {
        this.wallet = wallet;
        this.start();
    }

    async start() {
        this.address = await this.wallet.getAddress();

        console.log("Datadir: ", utils.getDatadir());
        console.log("Wallet address: ", this.address);

        this.ao = getAoInstance({ wallet: this.wallet });

        providerAnnouncements.startChecking();

        const { placementChunkQueue } = require('./background/placementChunkQueue');
        placementChunkQueue; // start the queue
    }

    async getAssignments() {
        const assignments = await Assignment.findAll();
        return assignments;
    }

    async getPlacements(assignmentId) {
        const placements = await Placement.findAll({ where: { assignment_id: assignmentId } });
        return placements;
    }
}

let clientInstance;

function getClientInstance(initialState = null) {
    if(!clientInstance) {
        if (!initialState) throw new Error("Client is not initialized with a state");
        clientInstance = new Client(initialState);
    }

    return clientInstance;
}

module.exports = getClientInstance;
