const nodepath = require('path');
const os = require('os');
const config = require('../config');

module.exports = {
    setDataDir: function(path) {
        process.env.DATADIR = this.resolveHome(path);
    },
    getDatadir: function(path) {
        const datadir = process.env.DATADIR;
        return path ? nodepath.join(datadir, path) : datadir;
    },
    getMode: function() {
        return process.env.MODE;
    },
    resolveHome: function(filepath) {
        if (filepath[0] === '~') {
            return nodepath.join(process.env.HOME || os.homedir(), filepath.slice(1));
        }
        return filepath;
    },
    getModeConfig: function() {
        const mode = this.getMode();
        return config[mode];
    },
    hashFn: function(buf) {
        if (!Buffer.isBuffer(buf)) {
            throw new Error('Expected a buffer');
        }

        const crypto = require('crypto');
        const hash = crypto.createHash('sha256');
        hash.update(buf);
        return hash.digest();
    },
    hashFnHex: function(buf) {
        return this.hashFn(buf).toString('hex');
    },
    merkleDerive: function(values, digestFn, initial_iteration) {
        // This is a modified version of https://www.npmjs.com/package/merkle-lib
        // Modified to defend merkle trees from second preimage attack
        const length = values.length;
        const results = [];
    
        for (let i = 0; i < length; i += 2) {
            const left = values[i];
            const right = i + 1 === length ? left : values[i + 1];
            const data = initial_iteration
                ? Buffer.concat([Buffer.from([0x00]), left, right])
                : Buffer.concat([left, right]);
    
            results.push(digestFn(data));
        }
    
        return results;
    },
    merkle: function(values, digestFn) {
        if (!Array.isArray(values)) throw TypeError('Expected values Array');
        if (typeof digestFn !== 'function') throw TypeError('Expected digest Function');

        // if (values.length === 1) return values.concat() // We don't do this because we would mess up format length

        const levels = [values];
        let level = values;
        let initial_iteration = true;

        do {
            level = this.merkleDerive(level, digestFn, initial_iteration);
            levels.push(level);
            initial_iteration = false;
        } while (level.length > 1);

        return [...levels].flat();
    },
    normalizeHeaders(headers) {
        const normalized = {};
        for (const key in headers) {
            normalized[key.toLowerCase()] = headers[key];
        }
        return normalized;
    },
    mkdirp: function(path) {
        const fs = require('fs');
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
        }
    },
    myExternalIP: async function() {
        const services = ['https://ifconfig.me', 'https://api.ipify.org', 'https://ipinfo.io/ip'];
        let service = services[0];
        const axios = require('axios');
        try {
            const response = await axios.get(service);
            return response.data;                
        } catch (e) {
            let service = services[1];
            try {
                const response = await axios.get(service);
                return response.data;                
            } catch (e) {
                let service = services[2];
                try {
                    const response = await axios.get(service);
                    return response.data;                
                } catch (e) {
                    throw e;
                }
            }
        }
    },
    xorBuffersInPlace: function(a, b) {
        var length = Math.min(a.length, b.length);
        for (var i = 0; i < length; ++i) {
            a[i] = a[i] ^ b[i];
        }
        return a;
    }
}