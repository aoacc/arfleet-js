const nodepath = require('path');
const os = require('os');
const config = require('../config');

module.exports = {
    setDataDir: (path) => {
        process.env.DATADIR = this.resolveHome(path);
    },
    getDatadir: (path) => {
        const datadir = process.env.DATADIR;
        return path ? nodepath.join(datadir, path) : datadir;
    },
    getMode: () => {
        return process.env.MODE;
    },
    resolveHome: (filepath) => {
        if (filepath[0] === '~') {
            return nodepath.join(process.env.HOME || os.homedir(), filepath.slice(1));
        }
        return filepath;
    },
    getModeConfig: () => {
        const mode = this.getMode();
        return config[mode];
    },
    hashFn: (buf) => {
        if (!Buffer.isBuffer(buf)) {
            throw new Error('Expected a buffer');
        }

        const crypto = require('crypto');
        const hash = crypto.createHash('sha256');
        hash.update(buf);
        return hash.digest('hex');
    }
}