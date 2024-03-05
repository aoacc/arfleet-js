const fs = require('fs');
const nodepath = require('path');

const startProviderRepl = async (provider) => {
    const readline = require('readline');

    // check that the terminal width is at least 80
    const terminal_width = process.stdout.columns;
    if (terminal_width >= 80) {
        const logo_txt = fs.readFileSync(nodepath.join(__dirname, '..', '..', 'resources/logo.txt'), 'utf-8');

        // print logo
        console.log(logo_txt);
    }

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
                let connectionStrings = line.split(' ')[1]
                await announce(provider, connectionStrings);
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