const { Command } = require('commander');
const fs = require('fs');
const utils = require('./utils');

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
        process.env.DATADIR = utils.resolveHome(program.datadir);
    } else {
        process.env.DATADIR = utils.resolveHome(config[process.env.MODE].defaultDatadir);
    }
    // Create if doesn't exist
    if (!fs.existsSync(process.env.DATADIR)) {
        fs.mkdirSync(process.env.DATADIR, { recursive: true });
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