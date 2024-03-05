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
            console.log('level', level);
            levels.push(level);
            initial_iteration = false;
        } while (level.length > 1);

        return [...levels].flat();
    },
    merkleDeriveFull: function(values, digestFn, initial_iteration) {
        // This is a modified version of https://www.npmjs.com/package/merkle-lib
        // Modified to defend merkle trees from second preimage attack
        const length = values.length;
        const results = [];
    
        for (let i = 0; i < length; i += 2) {
            const left = values[i];
            const right = i + 1 === length ? left : values[i + 1];
            const data = initial_iteration
                ? Buffer.concat([Buffer.from([0x00]), left.value, right.value])
                : Buffer.concat([left.value, right.value]);

            const node = {
                "value": digestFn(data),
                "left": left,
                "right": right
            }
    
            results.push(node);
        }
    
        return results;
    },
    merkleFull: function(valuesBin, digestFn) {
        if (!Array.isArray(valuesBin)) throw TypeError('Expected values Array');
        if (typeof digestFn !== 'function') throw TypeError('Expected digest Function');

        // if (values.length === 1) return values.concat() // We don't do this because we would mess up format length

        let values = [];
        for (let i = 0; i < valuesBin.length; i++) {
            values.push({"value": valuesBin[i], "left": null, "right": null});
        }

        const levels = [values];
        let level = values;
        let initial_iteration = true;

        do {
            level = this.merkleDeriveFull(level, digestFn, initial_iteration);
            // console.log('level', level);
            levels.push(level);
            initial_iteration = false;
        } while (level.length > 1);

        // verify that only one is left
        if (level.length !== 1) {
            throw new Error('Merkle tree is not valid');
        }

        return level[0];
    },
    merkleFullBinToHex: function(node) {
        return {
            "value": node.value.toString('hex'),
            "left": node.left ? this.merkleFullBinToHex(node.left) : null,
            "right": node.right ? this.merkleFullBinToHex(node.right) : null
        }
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
        let lastError = null;
        for (let service of services) {
            const axios = require('axios');
            try {
                const response = await axios.get(service);
                return response.data;                
            } catch (e) {
                lastError = e;
                continue;
            }
        }
        throw lastError;
    },
    xorBuffersInPlace: function(a, b) {
        var length = Math.min(a.length, b.length);
        for (var i = 0; i < length; ++i) {
            a[i] = a[i] ^ b[i];
        }
        return a;
    }
}