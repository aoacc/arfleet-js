const { Command } = require('commander');
const fs = require('fs');
const utils = require('./utils');
const readline = require('readline');
const { checkPasses, hasPass } = require('./arweave/passes');

(async() => {
    const program = new Command();
    program.storeOptionsAsProperties();
    
    const app = require('../package.json');
    program.version(app.version || 'N/A');

    program.description("Arfleet\nhttps://arfleet.io\n\nLicensed under MIT license.");

    program.option('-d, --datadir <path>', 'path to the data directory');
    program.option('-v, --verbose', 'force the logger to show debug level messages', false);

    const clientCommand = program.command('client')
    clientCommand
        .description('start as a client')
        .action(() => { process.env.MODE = 'client'; });

    clientCommand.command('store <path>')
        .description('store a file/folder')
        .action((path) => {
            process.env.MODE = 'client';
            process.env.SUBMODE = 'store';
            process.env.STORE_PATH = path;
        });
    clientCommand.command('makemigration')
        .description('[for developers] create a migration file from models')
        .action(() => {
            process.env.MODE = 'client';
            process.env.SUBMODE = 'makemigration';
        });
    clientCommand.command('migrate')
        .description('[for developers] migrate the database')
        .action(() => {
            process.env.MODE = 'client';
            process.env.SUBMODE = 'migrate';
        });
    clientCommand.command('transferpass <address>')
        .description('transfer the pass to the given address')
        .action((address) => {
            process.env.MODE = 'client';
            process.env.SUBMODE = 'transferpass';
            process.env.TRANSFERPASS_ADDRESS = address;
        });

    const providerCommand = program.command('provider');
    providerCommand
        .description('start as a provider')
        .action(() => { process.env.MODE = 'provider'; });
    providerCommand.command('makemigration')
        .description('[for developers] create a migration file from models')
        .action(() => {
            process.env.MODE = 'provider';
            process.env.SUBMODE = 'makemigration';
        });
    providerCommand.command('migrate')
        .description('[for developers] migrate the database')
        .action(() => {
            process.env.MODE = 'provider';
            process.env.SUBMODE = 'migrate';
        });
    providerCommand.command('transferpass <address>')
        .description('transfer the pass to the given address')
        .action((address) => {
            process.env.MODE = 'provider';
            process.env.SUBMODE = 'transferpass';
            process.env.TRANSFERPASS_ADDRESS = address;
        });

    program.parse(process.argv);

    // Print version
    console.log("ArFleet v" + app.version);

    // Load config
    const config = require('./config');

    // Set datadir
    if (program.datadir) {
        process.env.DATADIR = utils.resolveHome(program.datadir);
    } else {
        process.env.DATADIR = utils.resolveHome(config[process.env.MODE].defaultDatadir);
    }
    // Create if doesn't exist
    utils.mkdirp(process.env.DATADIR);

    // Make migration mode
    if (process.env.SUBMODE && process.env.SUBMODE === 'makemigration') {
        const { makeMigration } = require('./db/makemigration');
        makeMigration();
        process.exit(0);
    }

    // Migrate mode
    if (process.env.SUBMODE && process.env.SUBMODE === 'migrate') {
        const { migrate } = require('./db/migrate');
        await migrate();
        console.log("Migration done.")
        process.exit(0);
    }

    // Migrate every time anyway
    const { migrate } = require('./db/migrate');
    await migrate();

    if (process.env.MODE === 'client') {
        if (process.env.SUBMODE === 'store') {
            const cmd = require('./cmd');
            await cmd.client_store(process.env.STORE_PATH);
            process.exit(0);
        }
    }

    // Init wallet
    const { initWallet } = require('./wallet');
    const wallet = await initWallet();

    // Transfer pass mode
    if (process.env.SUBMODE && process.env.SUBMODE === 'transferpass') {
        try {
            const { getAoInstance } = require('./arweave/ao');
            const ao = getAoInstance({ wallet });

            if (!process.env.TRANSFERPASS_ADDRESS || !process.env.TRANSFERPASS_ADDRESS.length) {
                throw new Error("address is not given for transferpass");
            }

            await checkPasses(true);
            const ourAddress = await wallet.getAddress();
            const has = await hasPass(ourAddress);
            if (!has) {
                throw new Error("You don't have a pass to transfer");
            }

            console.log("This will transfer pass to", process.env.TRANSFERPASS_ADDRESS);
            console.log("Please confirm by typing 'yes'");

            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            rl.question('Confirm transfer: ', async (answer) => {
                if (answer === 'yes') {
                    const result = await ao.transferPass(process.env.TRANSFERPASS_ADDRESS);
                    console.log("Transfer result:", result);
                } else {
                    console.log("Transfer cancelled.");
                }
                rl.close();
                process.exit(0);
            });

            return;

        } catch(e) {
            console.error(e);
            process.exit(1);
        }
    }

    // Start API
    const { startApi } = require('./api');
    await startApi();

    // Start client/provider
    switch(process.env.MODE) {
        case 'client':
            const getClientInstance = require('./client');
            getClientInstance({ wallet });
            break;

        case 'provider':
            const getProviderInstance = require('./provider');
            getProviderInstance({ wallet });
            break;
    }
})();