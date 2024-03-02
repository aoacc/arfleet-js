const path = require('path');
const os = require('os');

module.exports = {
    getDatadir: () => {
        return process.env.DATADIR;
    },
    getMode: () => {
        return process.env.MODE;
    },
    resolveHome: (filepath) => {
        if (filepath[0] === '~') {
            return path.join(process.env.HOME || os.homedir(), filepath.slice(1));
        }
        return filepath;
    }
}