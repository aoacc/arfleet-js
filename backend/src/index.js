const { Command } = require('commander');

(async() => {
    const program = new Command();
    program.storeOptionsAsProperties();
    
    const app = require('../package.json');
    program.version(app.version || 'N/A');

    program.description("TempWeave\nhttps://tempweave.com\n\nLicensed under MIT license.");

    program.option('-d, --datadir <path>', 'path to the data directory');
    program.option('-v, --verbose', 'force the logger to show debug level messages', false);

    program.command('client').description('start as a client').action(() => { process.env.MODE = 'client'; });
    program.command('provider').description('start as a provider').action(() => { process.env.MODE = 'provider'; });

    program.parse(process.argv);

    // Load config
    const config = require('./config');

    // Set datadir
    if (program.datadir) {
        process.env.DATADIR = program.datadir;
    } else {
        process.env.DATADIR = config.datadir;
    }

    switch(process.env.MODE) {
        case 'client':
            const { startClient } = require('./client');
            await startClient();
            break;

        case 'provider':
            const { startProvider } = require('./provider');
            await startProvider();
            break;
    }

    const { startApi } = require('./api');
    await startApi();
})();