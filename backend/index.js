const mode = process.argv[2];

require('./src/config');
require('./src/common');

switch(mode) {
    case 'client':
        require('./src/client');
        break;
    case 'provider':
        require('./src/provider');
        break;
}

require('./src/api');