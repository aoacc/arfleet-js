'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "chunks", deps: []
 * createTable "assignments", deps: []
 * createTable "p_s_placements", deps: []
 * createTable "assignment_chunks", deps: [assignments]
 * createTable "placements", deps: [assignments]
 * createTable "placement_chunks", deps: [placements]
 * createTable "p_s_placement_chunks", deps: [p_s_placements]
 * addIndex "assignment_chunks_assignment_id_pos" to table "assignment_chunks"
 * addIndex "placement_chunks_placement_id_is_sent" to table "placement_chunks"
 * addIndex "placement_chunks_placement_id_pos" to table "placement_chunks"
 * addIndex "placement_chunks_encrypted_chunk_id" to table "placement_chunks"
 * addIndex "placement_chunks_original_chunk_id" to table "placement_chunks"
 * addIndex "placement_chunks_is_sent" to table "placement_chunks"
 * addIndex "placement_chunks_is_encrypted" to table "placement_chunks"
 * addIndex "placement_chunks_placement_id" to table "placement_chunks"
 * addIndex "p_s_placement_chunks_placement_id_is_received" to table "p_s_placement_chunks"
 * addIndex "p_s_placement_chunks_placement_id_pos" to table "p_s_placement_chunks"
 * addIndex "p_s_placement_chunks_encrypted_chunk_id" to table "p_s_placement_chunks"
 * addIndex "p_s_placement_chunks_original_chunk_id" to table "p_s_placement_chunks"
 * addIndex "p_s_placement_chunks_placement_id" to table "p_s_placement_chunks"
 *
 **/

var info = {
    "revision": 1,
    "name": "automigration",
    "created": "2024-03-05T22:13:37.216Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
            fn: "createTable",
            params: [
                "chunks",
                {
                    "id": {
                        "type": Sequelize.STRING,
                        "field": "id",
                        "primaryKey": true,
                        "unique": true,
                        "allowNull": false
                    },
                    "size": {
                        "type": Sequelize.INTEGER,
                        "field": "size",
                        "allowNull": true
                    },
                    "created_at": {
                        "type": Sequelize.DATE,
                        "field": "created_at",
                        "allowNull": false
                    },
                    "updated_at": {
                        "type": Sequelize.DATE,
                        "field": "updated_at",
                        "allowNull": false
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "assignments",
                {
                    "id": {
                        "type": Sequelize.STRING,
                        "field": "id",
                        "primaryKey": true,
                        "unique": true,
                        "allowNull": false
                    },
                    "size": {
                        "type": Sequelize.INTEGER,
                        "field": "size",
                        "allowNull": true
                    },
                    "chunk_count": {
                        "type": Sequelize.INTEGER,
                        "field": "chunk_count",
                        "allowNull": true
                    },
                    "root_hash": {
                        "type": Sequelize.STRING,
                        "field": "root_hash",
                        "allowNull": true
                    },
                    "desired_redundancy": {
                        "type": Sequelize.INTEGER,
                        "field": "desired_redundancy",
                        "allowNull": true
                    },
                    "achieved_redundancy": {
                        "type": Sequelize.INTEGER,
                        "field": "achieved_redundancy",
                        "defaultValue": 0,
                        "allowNull": false
                    },
                    "is_active": {
                        "type": Sequelize.BOOLEAN,
                        "field": "is_active",
                        "defaultValue": false,
                        "allowNull": false
                    },
                    "created_at": {
                        "type": Sequelize.DATE,
                        "field": "created_at",
                        "allowNull": false
                    },
                    "updated_at": {
                        "type": Sequelize.DATE,
                        "field": "updated_at",
                        "allowNull": false
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "p_s_placements",
                {
                    "id": {
                        "type": Sequelize.STRING,
                        "field": "id",
                        "primaryKey": true,
                        "unique": true,
                        "allowNull": false
                    },
                    "client_id": {
                        "type": Sequelize.STRING,
                        "field": "client_id",
                        "allowNull": false
                    },
                    "merkle_root": {
                        "type": Sequelize.STRING,
                        "field": "merkle_root",
                        "allowNull": true
                    },
                    "merkle_tree_full": {
                        "type": Sequelize.JSON,
                        "field": "merkle_tree_full",
                        "allowNull": true
                    },
                    "process_id": {
                        "type": Sequelize.STRING,
                        "field": "process_id",
                        "allowNull": true
                    },
                    "public_key": {
                        "type": Sequelize.STRING,
                        "field": "public_key",
                        "allowNull": true
                    },
                    "expires": {
                        "type": Sequelize.BIGINT,
                        "field": "expires",
                        "allowNull": true
                    },
                    "next_challenge": {
                        "type": Sequelize.DATE,
                        "field": "next_challenge",
                        "allowNull": true
                    },
                    "is_collaterized": {
                        "type": Sequelize.BOOLEAN,
                        "field": "is_collaterized",
                        "defaultValue": false,
                        "allowNull": false
                    },
                    "status": {
                        "type": Sequelize.STRING,
                        "field": "status",
                        "defaultValue": "created",
                        "allowNull": false
                    },
                    "created_at": {
                        "type": Sequelize.DATE,
                        "field": "created_at",
                        "allowNull": false
                    },
                    "updated_at": {
                        "type": Sequelize.DATE,
                        "field": "updated_at",
                        "allowNull": false
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "assignment_chunks",
                {
                    "id": {
                        "type": Sequelize.STRING,
                        "field": "id",
                        "primaryKey": true,
                        "unique": true,
                        "allowNull": false
                    },
                    "assignment_id": {
                        "type": Sequelize.STRING,
                        "field": "assignment_id",
                        "allowNull": false
                    },
                    "pos": {
                        "type": Sequelize.INTEGER,
                        "field": "pos",
                        "allowNull": true
                    },
                    "chunk_id": {
                        "type": Sequelize.STRING,
                        "field": "chunk_id",
                        "allowNull": true
                    },
                    "created_at": {
                        "type": Sequelize.DATE,
                        "field": "created_at",
                        "allowNull": false
                    },
                    "updated_at": {
                        "type": Sequelize.DATE,
                        "field": "updated_at",
                        "allowNull": false
                    },
                    "AssignmentId": {
                        "type": Sequelize.STRING,
                        "field": "assignment_id",
                        "onUpdate": "CASCADE",
                        "onDelete": "SET NULL",
                        "references": {
                            "model": "assignments",
                            "key": "id"
                        },
                        "allowNull": true
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "placements",
                {
                    "id": {
                        "type": Sequelize.STRING,
                        "field": "id",
                        "primaryKey": true,
                        "unique": true,
                        "allowNull": false
                    },
                    "assignment_id": {
                        "type": Sequelize.STRING,
                        "field": "assignment_id",
                        "allowNull": false
                    },
                    "provider_id": {
                        "type": Sequelize.STRING,
                        "field": "provider_id",
                        "allowNull": false
                    },
                    "provider_connection_strings": {
                        "type": Sequelize.JSON,
                        "field": "provider_connection_strings",
                        "allowNull": true
                    },
                    "merkle_root": {
                        "type": Sequelize.STRING,
                        "field": "merkle_root",
                        "allowNull": true
                    },
                    "merkle_tree": {
                        "type": Sequelize.JSON,
                        "field": "merkle_tree",
                        "allowNull": true
                    },
                    "process_id": {
                        "type": Sequelize.STRING,
                        "field": "process_id",
                        "allowNull": true
                    },
                    "private_key": {
                        "type": Sequelize.STRING,
                        "field": "private_key",
                        "allowNull": true
                    },
                    "public_key": {
                        "type": Sequelize.STRING,
                        "field": "public_key",
                        "allowNull": true
                    },
                    "expires": {
                        "type": Sequelize.BIGINT,
                        "field": "expires",
                        "allowNull": true
                    },
                    "is_funded": {
                        "type": Sequelize.BOOLEAN,
                        "field": "is_funded",
                        "defaultValue": false,
                        "allowNull": false
                    },
                    "required_reward": {
                        "type": Sequelize.BIGINT,
                        "field": "required_reward",
                        "allowNull": true
                    },
                    "required_collateral": {
                        "type": Sequelize.BIGINT,
                        "field": "required_collateral",
                        "allowNull": true
                    },
                    "error_was": {
                        "type": Sequelize.STRING,
                        "field": "error_was",
                        "allowNull": true
                    },
                    "status": {
                        "type": Sequelize.STRING,
                        "field": "status",
                        "defaultValue": "created",
                        "allowNull": false
                    },
                    "created_at": {
                        "type": Sequelize.DATE,
                        "field": "created_at",
                        "allowNull": false
                    },
                    "updated_at": {
                        "type": Sequelize.DATE,
                        "field": "updated_at",
                        "allowNull": false
                    },
                    "AssignmentId": {
                        "type": Sequelize.STRING,
                        "field": "assignment_id",
                        "onUpdate": "CASCADE",
                        "onDelete": "SET NULL",
                        "references": {
                            "model": "assignments",
                            "key": "id"
                        },
                        "allowNull": true
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "placement_chunks",
                {
                    "id": {
                        "type": Sequelize.STRING,
                        "field": "id",
                        "primaryKey": true,
                        "unique": true,
                        "allowNull": false
                    },
                    "placement_id": {
                        "type": Sequelize.STRING,
                        "field": "placement_id",
                        "allowNull": false
                    },
                    "is_encrypted": {
                        "type": Sequelize.BOOLEAN,
                        "field": "is_encrypted",
                        "defaultValue": false,
                        "allowNull": false
                    },
                    "is_sent": {
                        "type": Sequelize.BOOLEAN,
                        "field": "is_sent",
                        "defaultValue": false,
                        "allowNull": false
                    },
                    "original_chunk_id": {
                        "type": Sequelize.STRING,
                        "field": "original_chunk_id",
                        "allowNull": true
                    },
                    "encrypted_chunk_id": {
                        "type": Sequelize.STRING,
                        "field": "encrypted_chunk_id",
                        "allowNull": true
                    },
                    "pos": {
                        "type": Sequelize.INTEGER,
                        "field": "pos",
                        "allowNull": true
                    },
                    "created_at": {
                        "type": Sequelize.DATE,
                        "field": "created_at",
                        "allowNull": false
                    },
                    "updated_at": {
                        "type": Sequelize.DATE,
                        "field": "updated_at",
                        "allowNull": false
                    },
                    "PlacementId": {
                        "type": Sequelize.STRING,
                        "field": "placement_id",
                        "onUpdate": "CASCADE",
                        "onDelete": "SET NULL",
                        "references": {
                            "model": "placements",
                            "key": "id"
                        },
                        "allowNull": true
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "p_s_placement_chunks",
                {
                    "id": {
                        "type": Sequelize.STRING,
                        "field": "id",
                        "primaryKey": true,
                        "unique": true,
                        "allowNull": false
                    },
                    "placement_id": {
                        "type": Sequelize.STRING,
                        "field": "placement_id",
                        "allowNull": false
                    },
                    "original_chunk_id": {
                        "type": Sequelize.STRING,
                        "field": "original_chunk_id",
                        "allowNull": true
                    },
                    "encrypted_chunk_id": {
                        "type": Sequelize.STRING,
                        "field": "encrypted_chunk_id",
                        "allowNull": true
                    },
                    "is_received": {
                        "type": Sequelize.BOOLEAN,
                        "field": "is_received",
                        "defaultValue": false,
                        "allowNull": false
                    },
                    "pos": {
                        "type": Sequelize.INTEGER,
                        "field": "pos",
                        "allowNull": true
                    },
                    "created_at": {
                        "type": Sequelize.DATE,
                        "field": "created_at",
                        "allowNull": false
                    },
                    "updated_at": {
                        "type": Sequelize.DATE,
                        "field": "updated_at",
                        "allowNull": false
                    },
                    "PSPlacementId": {
                        "type": Sequelize.STRING,
                        "field": "p_s_placement_id",
                        "onUpdate": "CASCADE",
                        "onDelete": "SET NULL",
                        "references": {
                            "model": "p_s_placements",
                            "key": "id"
                        },
                        "allowNull": true
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "addIndex",
            params: [
                "assignment_chunks",
                ["assignment_id", "pos"],
                {
                    "indexName": "assignment_chunks_assignment_id_pos",
                    "name": "assignment_chunks_assignment_id_pos",
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "addIndex",
            params: [
                "placement_chunks",
                ["placement_id", "is_sent"],
                {
                    "indexName": "placement_chunks_placement_id_is_sent",
                    "name": "placement_chunks_placement_id_is_sent",
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "addIndex",
            params: [
                "placement_chunks",
                ["placement_id", "pos"],
                {
                    "indexName": "placement_chunks_placement_id_pos",
                    "name": "placement_chunks_placement_id_pos",
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "addIndex",
            params: [
                "placement_chunks",
                ["encrypted_chunk_id"],
                {
                    "indexName": "placement_chunks_encrypted_chunk_id",
                    "name": "placement_chunks_encrypted_chunk_id",
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "addIndex",
            params: [
                "placement_chunks",
                ["original_chunk_id"],
                {
                    "indexName": "placement_chunks_original_chunk_id",
                    "name": "placement_chunks_original_chunk_id",
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "addIndex",
            params: [
                "placement_chunks",
                ["is_sent"],
                {
                    "indexName": "placement_chunks_is_sent",
                    "name": "placement_chunks_is_sent",
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "addIndex",
            params: [
                "placement_chunks",
                ["is_encrypted"],
                {
                    "indexName": "placement_chunks_is_encrypted",
                    "name": "placement_chunks_is_encrypted",
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "addIndex",
            params: [
                "placement_chunks",
                ["placement_id"],
                {
                    "indexName": "placement_chunks_placement_id",
                    "name": "placement_chunks_placement_id",
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "addIndex",
            params: [
                "p_s_placement_chunks",
                ["placement_id", "is_received"],
                {
                    "indexName": "p_s_placement_chunks_placement_id_is_received",
                    "name": "p_s_placement_chunks_placement_id_is_received",
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "addIndex",
            params: [
                "p_s_placement_chunks",
                ["placement_id", "pos"],
                {
                    "indexName": "p_s_placement_chunks_placement_id_pos",
                    "name": "p_s_placement_chunks_placement_id_pos",
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "addIndex",
            params: [
                "p_s_placement_chunks",
                ["encrypted_chunk_id"],
                {
                    "indexName": "p_s_placement_chunks_encrypted_chunk_id",
                    "name": "p_s_placement_chunks_encrypted_chunk_id",
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "addIndex",
            params: [
                "p_s_placement_chunks",
                ["original_chunk_id"],
                {
                    "indexName": "p_s_placement_chunks_original_chunk_id",
                    "name": "p_s_placement_chunks_original_chunk_id",
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "addIndex",
            params: [
                "p_s_placement_chunks",
                ["placement_id"],
                {
                    "indexName": "p_s_placement_chunks_placement_id",
                    "name": "p_s_placement_chunks_placement_id",
                    "transaction": transaction
                }
            ]
        }
    ];
};
var rollbackCommands = function(transaction) {
    return [{
            fn: "dropTable",
            params: ["chunks", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["assignments", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["assignment_chunks", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["placements", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["placement_chunks", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["p_s_placements", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["p_s_placement_chunks", {
                transaction: transaction
            }]
        }
    ];
};

module.exports = {
    pos: 0,
    useTransaction: true,
    execute: function(queryInterface, Sequelize, _commands)
    {
        var index = this.pos;
        function run(transaction) {
            const commands = _commands(transaction);
            return new Promise(function(resolve, reject) {
                function next() {
                    if (index < commands.length)
                    {
                        let command = commands[index];
                        console.log("[#"+index+"] execute: " + command.fn);
                        index++;
                        queryInterface[command.fn].apply(queryInterface, command.params).then(next, reject);
                    }
                    else
                        resolve();
                }
                next();
            });
        }
        if (this.useTransaction) {
            return queryInterface.sequelize.transaction(run);
        } else {
            return run(null);
        }
    },
    up: function(queryInterface, Sequelize)
    {
        return this.execute(queryInterface, Sequelize, migrationCommands);
    },
    down: function(queryInterface, Sequelize)
    {
        return this.execute(queryInterface, Sequelize, rollbackCommands);
    },
    info: info
};
