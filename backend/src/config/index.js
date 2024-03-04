const defaultConfig = {
    walletPath: 'wallet.json',
    client: {
        defaultDatadir: '~/.tempweave-client',
        apiServer: {
            host: '127.0.0.1',
            port: 8885
        }
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
        }
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
};

module.exports = defaultConfig;