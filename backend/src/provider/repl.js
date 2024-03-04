const startProviderRepl = async (provider) => {
    const readline = require('readline');

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
                await announce(provider, line.split(' ')[1]);
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