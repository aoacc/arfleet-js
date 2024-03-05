const Model = require('./base');
const Sequelize = require('sequelize');

class PSPlacement extends Model {
    constructor(...args) {
        super(...args);
    }

    validateOwnership(client_id) {
        if (this.client_id !== client_id) {
            throw new Error('Client does not own this placement');
        }
    }

    validateStatus(status) {
        if (this.status !== status) {
            throw new Error(`Placement status is not ${status}`);
        }
    }

    async getCollateralLeftToSend() {
        const ao = require('../../arweave/deal');
        const state = await ao.getState(this.process_id)

        return state["RequiredCollateral"] - state["ReceivedCollateral"];
    }
}

PS_PLACEMENT_STATUS = {
    CREATED: 'created',
    ACCEPTED: 'accepted',
    FAILED: 'failed',
    COMPLETED: 'completed',
}

PSPlacement.init(
    {
        id: {type: Sequelize.DataTypes.STRING, unique: true, primaryKey: true},
        client_id: {type: Sequelize.DataTypes.STRING, allowNull: false},
        merkle_root: {type: Sequelize.DataTypes.STRING, allowNull: true},
        merkle_tree: {type: Sequelize.DataTypes.JSON, allowNull: true},
        process_id: {type: Sequelize.DataTypes.STRING, allowNull: true},
        public_key: {type: Sequelize.DataTypes.STRING, allowNull: true},
        expires: {type: Sequelize.DataTypes.BIGINT, allowNull: true},
        is_collaterized: {type: Sequelize.DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
        status: {
            type: Sequelize.DataTypes.STRING,
            defaultValue: PS_PLACEMENT_STATUS.CREATED
        }
    },
    {
        indexes: [
            // {fields: ['ul_status']},
            // {fields: ['dl_status']}
        ]
    }
);

// // NOTE: These hooks are not working when using .update(). Had to hook into ::update() method

// const modificationHook = (m) => {
//     if (m.changed() && m.changed().includes('status')) {
//         const { placementQueue } = require('../../client/background/placementQueue');
//         placementQueue.add(m.id);
//     }
// };

// Placement.addHook('afterDestroy', (m) => modificationHook(m));
// Placement.addHook('afterUpdate', (m) => modificationHook(m));
// Placement.addHook('afterSave', (m) => modificationHook(m));
// Placement.addHook('afterUpsert', (m) => modificationHook(m[0]));

module.exports = { PSPlacement, PS_PLACEMENT_STATUS };
