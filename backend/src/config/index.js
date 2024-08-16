const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;
const TB = 1024 * GB;
const PB = 1024 * TB;

const WINSTON = 1;
const AR = 10 ** 12;

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

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

    defaultToken: 'Go7M21ZoTxQndTFoKuroaHgh6s2Yw3cDi_dpsG4F2M0',
    marketplace: '-jydy0Gqhtdf2ilVR0zbGrizkx4GJXfcvpJYXzQxwlU',
    aoScheduler: '_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA',
    aosModule: '9afQ1PLf2mrshqCTZEzzJTR2gWaC9zNPnYgYEqg1Pt4',

    aoConfig: {
        MU_URL: "https://ao-mu-1.onrender.com",
        CU_URL: "https://ao-cu-1.onrender.com",
        // GATEWAY_URL: "https://arweave.net",
        GATEWAY_URL: "https://arweave-search.goldsky.com",
    },

    rsa_encryption: {
        bits: 1024,
    }
};

module.exports = defaultConfig;
