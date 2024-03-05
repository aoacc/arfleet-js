const Model = require('./base');
const Sequelize = require('sequelize');
const { generateKeyPair } = require('../../encryption/rsa_keypair');

class Placement extends Model {
    constructor(...args) {
        super(...args);
    }

    async startEncryption() {
        const keypair = await generateKeyPair();
        this.private_key = keypair.private_key;
        this.public_key = keypair.public_key;
        await this.save();
    }

    getConnectionString() {
        return this.provider_connection_strings[0]; // todo: go through all in the future/certain %
    }
}

PLACEMENT_STATUS = {
    CREATED: 'created',
    UNAVAILABLE: 'unavailable',
    INITIALIZED: 'initialized',
    ENCRYPTED: 'encrypted',
    PROCESS_SPAWNED: 'process_spawned',
    FUNDED: 'funded',
    ACCEPTED: 'accepted',
    TRANSFERRED: 'transferred',
    FAILED: 'failed',
    COMPLETED: 'completed',
}

Placement.init(
    {
        id: {type: Sequelize.DataTypes.STRING, unique: true, primaryKey: true},
        assignment_id: {type: Sequelize.DataTypes.STRING, allowNull: false},
        provider_id: {type: Sequelize.DataTypes.STRING, allowNull: false},
        provider_connection_strings: {type: Sequelize.DataTypes.JSON, allowNull: true},
        merkle_root: {type: Sequelize.DataTypes.STRING, allowNull: true},
        merkle_tree: {type: Sequelize.DataTypes.JSON, allowNull: true},
        process_id: {type: Sequelize.DataTypes.STRING, allowNull: true},
        private_key: {type: Sequelize.DataTypes.STRING, allowNull: true},
        public_key: {type: Sequelize.DataTypes.STRING, allowNull: true},
        expires: {type: Sequelize.DataTypes.BIGINT, allowNull: true},
        is_funded: {type: Sequelize.DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
        status: {
            type: Sequelize.DataTypes.STRING,
            defaultValue: PLACEMENT_STATUS.CREATED
        }
        // dl_status: {
        //     type: Sequelize.DataTypes.STRING,
        //     defaultValue: CHUNK_DOWNLOAD_STATUS.NOT_STARTED
        // },
        // ul_status: {
        //     type: Sequelize.DataTypes.STRING,
        //     defaultValue: CHUNK_UPLOAD_STATUS.NOT_STARTED
        // },
        // retry_count: {type: Sequelize.DataTypes.INTEGER, defaultValue: 0},
        // validation_retry_count: {type: Sequelize.DataTypes.INTEGER, defaultValue: 0},
        // txid: {type: Sequelize.DataTypes.STRING, allowNull: true},
        // expires: {type: Sequelize.DataTypes.BIGINT, allowNull: true}
    },
    {
        indexes: [
            // {fields: ['ul_status']},
            // {fields: ['dl_status']}
        ]
    }
);

// NOTE: These hooks are not working when using .update(). Had to hook into ::update() method

const modificationHook = (m) => {
    if (m.changed() && m.changed().includes('status')) {
        const { placementQueue } = require('../../client/background/placementQueue');
        placementQueue.add(m.id);
    }
};

Placement.addHook('afterDestroy', (m) => modificationHook(m));
Placement.addHook('afterUpdate', (m) => modificationHook(m));
Placement.addHook('afterSave', (m) => modificationHook(m));
Placement.addHook('afterUpsert', (m) => modificationHook(m[0]));

module.exports = { Placement, PLACEMENT_STATUS };
