const fs = require("fs");
const nodepath = require("path");
const utils = require("../utils");
const config = require("../config");
const CHUNK_SIZE = config.chunk_size;

const chunkify = (buf) => {
    if (!Buffer.isBuffer(buf)) {
        throw new Error("Expected a buffer");
    }
    const totalChunks = Math.ceil(buf.length / CHUNK_SIZE);
    if (totalChunks <= 1) {
        return [buf];
    } else {
        const chunkBufs = [];
        for (let i = 0; i < totalChunks; i++) {
            chunkBufs.push(buf.subarray(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
        }
        return chunkBufs;
    }
};

const chunksToTotalLength = (chunks) =>
    (chunks.length - 1) * CHUNK_SIZE + chunks[chunks.length - 1].byteLength;

const buffersToHashes = (bufs) =>
    bufs.map(buf => hashFn(buf));

const processFile = async (path) => {
    // {"type": "file", "path": filePath, "size": size}
    const buf = fs.readFileSync(path, null);
    const chunks = chunkify(buf);
    const chunkHashes = buffersToHashes(chunks);
    const merkleTree = merkle(chunkHashes, hashFn);
    const filesize = chunksToTotalLength(chunks);
};

const storePath = async (path) => {
    const container = {};

    const stats = fs.statSync(path);
    if (stats.isFile()) {
        return processFile(path);
    } else {
        const files = fs.readdirSync(path);
        for (const file of files) {
            const filePath = nodepath.join(path, file);
            const subStats = fs.statSync(filePath);
            if (subStats.isDirectory()) {
                container[file] = await storePath(filePath);
            } else if (subStats.isFile()) {
                const size = subStats.size;
                container[file] = processFile(filePath);
            } else {
                throw new Error("Unknown file type: " + filePath);
            }
        }

        let size = 0;
        for (const key in container) {
            size += container[key].size;
        }

        return {"type": "directory", "size": size, "files": container};
    }
};

const store = async (path) => {
    const storeInfo = await storePath(path);
    console.log(storeInfo);
    return storeInfo;
};

module.exports = {
    store
};