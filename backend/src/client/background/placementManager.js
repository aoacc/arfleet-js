const axios = require('axios');
const Sequelize = require('sequelize');
const { PLACEMENT_STATUS } = require('../../db/models/Placement');
const { Assignment, Placement } = require('../../db/models');

class ProviderApi {
    constructor(connectionString) {
        this.connectionString = connectionString;
    }

    async cmd(command, data) {
        const url = `${this.connectionString}/cmd/${command}`;
        console.log('Sending request to: ', url);
        const response = await axios.post(url, data);
        return response.data;
    }
}

class PlacementManager {
    constructor() {
        this.placements = [];
        this.processing = false;
        this.boot();
    }

    async boot() {
        if (this.processing) return;

        this.processing = true;

        // find all where status is not 'failed' or 'completed'
        const placements = await Placement.findAll({
            where: {
                status: {
                    [Sequelize.Op.notIn]: [PLACEMENT_STATUS.UNAVAILABLE, PLACEMENT_STATUS.COMPLETED]
                }
            }
        });

        for (const placement of placements) {
            this.addPlacement(placement.id);
        }

        this.processing = false;
        this.processPlacements(); // no await
        // check from time to time
        setTimeout(() => {
            this.boot();
        }, 5 * 1000);
    }

    addPlacement(placement_id) {
        this.placements.push(placement_id);
        this.processPlacements(); // no await
    }

    removePlacement(placement_id) {
        this.placements = this.placements.filter(p => p !== placement_id);
    }

    getPlacements() {
        return this.placements;
    }

    async processPlacements() {
        if (this.processing) return;

        // before we make .processing = true, check if there's any work. if not, don't even bother
        if (this.placements.length === 0) return;

        this.processing = true;

        console.log('Processing placements');
        for (const placement_id of this.placements) {
            this.removePlacement(placement_id);
            await this.processPlacement(placement_id);
        }

        this.processing = false;

        // schedule next
        setTimeout(() => {
            this.processPlacements();
        }, 100);
    }

    async processPlacement(placement_id) {
        console.log('Processing placement: ', placement_id);

        const placement = await Placement.findOrFail(placement_id);
        console.log('Placement: ', placement);

        // Let's try to connect
        console.log('Trying to connect to provider: ', placement.provider_id);

        const connectionStrings = placement.provider_connection_strings;
        const connectionString = connectionStrings[0]; // todo: go through all in the future/certain %

        const pApi = new ProviderApi(connectionString);

        try {
            const result = await pApi.cmd('ping', {});
    
            console.log({result});

            const assignment = await Assignment.findOrFail(placement.id);

            if (result === 'pong') {
                // available, contact about the placement
                const placementResult = await pApi.cmd('placement', { size: assignment.size, chunks: assignment.chunk_count });

                console.log({placementResult});
            }
        } catch(e) {
            // mark as failed
            placement.status = PLACEMENT_STATUS.UNAVAILABLE;
            await placement.save();
        }
    }
}

let placementManager = new PlacementManager();

module.exports = placementManager;