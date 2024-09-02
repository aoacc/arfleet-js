const fs = require('fs');
const nodepath = require('path');
const utils = require('../utils');
const config = require('../config');
const { getAoInstance } = require('../arweave/ao');

const startProviderRepl = async (provider) => {
    const readline = require('readline');

    // check that the terminal width is at least 80
    const terminal_width = process.stdout.columns;
    if (terminal_width >= 80) {
        const logo_txt = fs.readFileSync(nodepath.join(__dirname, '..', '..', 'resources/logo.txt'), 'utf-8');

        // print logo
        console.log('\x1b[32m%s\x1b[0m', logo_txt); // Green color
    }

    console.log("Enter 'help' to see a list of commands.");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '> '
    });
    
    rl.prompt();
    
    rl.on('line', async(line) => {
        line = line.trim();
        cmd = line.split(' ')[0];

        switch (cmd) {
            case 'announce':
                console.log('Announcing...');
                const { announce } = require('./announce');
                let connectionStrings = process.env.CONNECTION_STRINGS || line.split(' ')[1]
                await announce(provider, connectionStrings);
                break;
            case 'balance':
                await utils.outputWalletAddressAndBalance(provider.ao, provider.address, config.defaultToken, config.defaultTokenDecimals, config.defaultTokenSymbol);
                break;
            case 'help':
                console.log('Commands:');
                console.log('  announce <connection_strings> - Announce the provider to the given connection strings');
                console.log('  balance - Show the balance of the provider');
                console.log('  help - Show this help message');
                console.log('  exit - Exit the REPL');
                console.log('  quit - Exit the REPL');
                break;
            case 'exit':
            case 'quit':
                rl.close();
                break;
            case '':
                break;
            default:
                console.log('Invalid command: "' + line.trim() + '"');
                break;
        }
        rl.prompt();
    }).on('close', () => {
        process.exit(0); // todo: warning, might kill background processes! need to shut down gracefully
    });
}

module.exports = {
    startProviderRepl
}