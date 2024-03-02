const defaultConfig = {
    walletPath: 'wallet.json',
    client: {
        defaultDatadir: '~/.tempweave-client',
        api_server: {
            host: '127.0.0.1',
            port: 8885
        }
    },
    provider: {
        defaultDatadir: '~/.tempweave-provider',
        api_server: {
            host: '127.0.0.1',
            port: 8886
        },
        public_server: {
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
    },
    chunk_size: 4096,
};

module.exports = defaultConfig;