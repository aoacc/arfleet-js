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
    bufs.map(buf => utils.hashFn(buf));

const processFile = async (buf) => {
    const chunks = chunkify(buf);
    const chunkHashes = buffersToHashes(chunks);
    const chunkHashesHex = chunkHashes.map(hash => hash.toString('hex'));
    const merkleTree = utils.merkle(chunkHashes, utils.hashFn);
    const filesize = chunksToTotalLength(chunks);

    // Let's save chunks into our storage
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkHash = chunkHashesHex[i];
        const chunkPath = utils.getDatadir('chunks/' + chunkHash);
        if (!fs.existsSync(chunkPath)) {
            utils.mkdirp(nodepath.dirname(chunkPath));
            fs.writeFileSync(chunkPath, chunk, null);
        }
    }

    const merkleRoot = merkleTree[merkleTree.length - 1];

    return {"type": "file", "hash": merkleRoot, "size": filesize, "chunks": chunkHashesHex};
};

const storePath = async (path) => {
    const container = {};

    const stats = fs.statSync(path);
    if (stats.isFile()) {
        const buf = fs.readFileSync
        return await processFile(buf);
    } else {
        const files = fs.readdirSync(path);
        for (const file of files) {
            const filePath = nodepath.join(path, file);
            const subStats = fs.statSync(filePath);
            if (subStats.isDirectory()) {
                container[file] = await storePath(filePath);
            } else if (subStats.isFile()) {
                const size = subStats.size;
                const buf = fs.readFileSync(filePath, null);
                container[file] = await processFile(buf);
            } else {
                throw new Error("Unknown file type: " + filePath);
            }
        }

        let size = 0;
        for (const key in container) {
            size += container[key].size;
        }

        const directoryFile = config.directory_prologue + JSON.stringify({
            "type": "directory",
            "size": size,
            "files": container
        });

        const dir = processFile(Buffer.from(directoryFile, 'utf-8'));

        return {
            "type": "dirptr",
            "hash": dir.hash,
            "size": dir.size + directoryFile.length,
        }
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