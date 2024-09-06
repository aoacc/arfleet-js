const { KB, MB, GB, TB, PB, WINSTON, AR, SECOND, MINUTE, HOUR, DAY, WEEK, MONTH, YEAR } = require('../utils/constants');

const defaultConfig = {
    walletPath: 'wallet.json',
    client: {
        defaultDatadir: '~/.arfleet-client',
        apiServer: {
            host: '127.0.0.1',
            port: 8885
        },
        defaultDesiredRedundancy: 1,
        defaultDesiredStorageDuration: 6 * MONTH,
        fetchAnnouncementsInterval: 1 * MINUTE,
        defaultMaxChallengeDuration: 1 * WEEK,
    },
    provider: {
        defaultDatadir: '~/.arfleet-provider',
        apiServer: {
            host: '127.0.0.1',
            port: 8886
        },
        publicServer: {
            host: '0.0.0.0',
            port: 8890
        },
        defaultStorageCapacity: 1 * GB,
        defaultStoragePriceDeal: 1 * WINSTON,
        defaultStoragePriceUploadKBSec: 1 * WINSTON,
        defaultMinStorageDuration: 1 * DAY,
        defaultMaxStorageDuration: 6 * MONTH,
        defaultMinChallengeDuration: 1 * DAY,
    },
    db: {
        define: {
            underscored: true,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        },
        dialect: 'sqlite',
        storage: 'arfleet.db',
        transactionType: 'DEFERRED',
        retry: {
            max: 5
        },
        enable_db_logging: false
    },
    chunkSize: 4096,
    _chunkSize: 2048,
    chunkinfoPrologue: 'ARFLEET\x05\x06\xf5\xf6*INFO',
    directoryPrologue: 'ARFLEET\x05\x06\xf5\xf6*DIR',
    encryptedChunkPrologue: 'ARFLEET\x05\x06\xf5\xf6*ENC',

    marketplace: '-jydy0Gqhtdf2ilVR0zbGrizkx4GJXfcvpJYXzQxwlU',
    aoScheduler: '_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA',
    aosModule: '9afQ1PLf2mrshqCTZEzzJTR2gWaC9zNPnYgYEqg1Pt4',
    defaultToken: 'xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10',
    defaultTokenDecimals: 12,
    defaultTokenSymbol: 'wAR',

    passes: {
        address: 'kBQOWxXVSj21ZhLqMTFEIJllEal1z_l8YgRRdxIm7pw',
        fetchPassesInterval: 5 * MINUTE,
    },

    aoConfig: {
        MU_URL: "https://mu.ao-testnet.xyz",
        CU_URL: "https://cu.ao-testnet.xyz",
        // GATEWAY_URL: "https://arweave.net",
        GATEWAY_URL: "https://arweave-search.goldsky.com",
    },

    rsa_encryption: {
        bits: 1024,
    }
};

module.exports = defaultConfig;
