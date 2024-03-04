const startProviderRepl = async () => {
    const readline = require('readline');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '> '
    });
    
    rl.prompt();
    
    rl.on('line', (line) => {
        switch (line.trim()) {
            case '.sayhello':
                console.log('Hello, how can I help you today?');
                break;
            default:
                console.log('You entered: "' + line.trim() + '"');
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