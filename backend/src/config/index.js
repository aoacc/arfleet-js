const defaultConfig = {
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
    }
};

module.exports = defaultConfig;