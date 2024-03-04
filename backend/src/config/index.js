const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;
const TB = 1024 * GB;
const PB = 1024 * TB;

const defaultConfig = {
    walletPath: 'wallet.json',
    client: {
        defaultDatadir: '~/.tempweave-client',
        apiServer: {
            host: '127.0.0.1',
            port: 8885
        },
        defaultDesiredRedundancy: 3,
    },
    provider: {
        defaultDatadir: '~/.tempweave-provider',
        apiServer: {
            host: '127.0.0.1',
            port: 8886
        },
        publicServer: {
            host: '0.0.0.0',
            port: 8890
        },
        defaultStorageCapacity: 1 * GB,
    },
    db: {
        define: {
            underscored: true,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        },
        dialect: 'sqlite',
        storage: 'tempweave.db',
        transactionType: 'DEFERRED',
        retry: {
            max: 5
        }
    },
    chunkSize: 1024,
    _chunkSize: 2048,
    chunkinfoPrologue: 'TEMPWEAVE\x05\x06\xf5\xf6*INFO',
    directoryPrologue: 'TEMPWEAVE\x05\x06\xf5\xf6*DIR',

    defaultToken: 'w_4ejp8gRKi2B2KEkVjwlj-W3CpDEfjtJ8qV_0mjNMI',
    marketplace: '-jydy0Gqhtdf2ilVR0zbGrizkx4GJXfcvpJYXzQxwlU',
    aoScheduler: '_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA',

    aoConfig: {
        MU_URL: "https://ao-mu-1.onrender.com",
        CU_URL: "https://ao-cu-1.onrender.com",
        GATEWAY_URL: "https://arweave.net",
        _ALT_GATEWAY_URL: "https://g8way.io",
    },

    rsa_encryption: {
        bits: 1024,
    }
};

module.exports = defaultConfig;