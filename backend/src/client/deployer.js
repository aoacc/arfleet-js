const fs = require("fs");
const nodepath = require("path");
const utils = require("../utils");
const config = require("../config");
const CHUNK_SIZE = config.chunkSize;
const { Assignment, AssignmentChunk } = require("../db/models");
const assignmentQueue = require("./background/assignmentQueue");

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

const processFile = async (buf, chunkQueue) => {
    const chunks = chunkify(buf);
    const chunkHashes = buffersToHashes(chunks);
    const chunkHashesHex = chunkHashes.map(hash => hash.toString('hex'));
    const merkleTree = utils.merkle(chunkHashes, utils.hashFn);
    const filesize = chunksToTotalLength(chunks);

    // Let's save chunks into our storage
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkHash = chunkHashesHex[i];
        const chunkPath = AssignmentChunk.getPath(chunkHash);
        if (!fs.existsSync(chunkPath)) {
            utils.mkdirp(nodepath.dirname(chunkPath));
            fs.writeFileSync(chunkPath, chunk, null);
        }

        chunkQueue.push(chunkHash);
    }

    let ret;
    if (chunks.length > 1) {
        const merkleRoot = merkleTree[merkleTree.length - 1];

        const fileIndex = config.chunkinfoPrologue + JSON.stringify({"type": "file", "hash": merkleRoot.toString('hex'), "size": filesize, "chunks": chunkHashesHex});
        const fileIndexRaw = Buffer.from(fileIndex, 'utf-8');
        const fileIndexResult = await processFile(fileIndexRaw, chunkQueue);
        // if fileIndexRaw is less than CHUNK_SIZE, we will just get its hash

        chunkQueue.push(fileIndexResult.hash);

        console.log({fileIndexResult, filesize, chunkHashesHex, merkleRoot, CHUNK_SIZE})

        ret = {
            "type": "fileptr",
            "hash": fileIndexResult.hash,
            "size": fileIndexRaw.length + filesize,
        };
    } else {
        ret = {
            "type": "file",
            "hash": chunkHashesHex[0],
            "size": filesize,
        };
    }

    console.log({ret});

    return ret;
};

const processDirectory = async (path, chunkQueue) => {
    const container = {};

    const files = fs.readdirSync(path);
    for (const file of files) {
        const filePath = nodepath.join(path, file);
        const subStats = fs.statSync(filePath);
        if (subStats.isDirectory()) {
            container[file] = await storePath(filePath, chunkQueue);
        } else if (subStats.isFile()) {
            const buf = fs.readFileSync(filePath, null);
            container[file] = await processFile(buf, chunkQueue);
        } else {
            throw new Error("Unknown file type: " + filePath);
        }
    }

    let size = 0;
    for (const key in container) {
        size += container[key].size;
    }

    const directoryIndex = {
        "type": "directory",
        "size": size,
        "files": container
    };
    const directoryIndexRaw = Buffer.from(config.directoryPrologue + JSON.stringify(directoryIndex), 'utf-8');

    const dir = await processFile(directoryIndexRaw, chunkQueue);
    // if directoryIndexRaw is less than CHUNK_SIZE, we will just get its hash

    const ret = {
        "type": "dirptr",
        "hash": dir.hash,
        "size": dir.size + size,
    }

    console.log({ret});

    return ret;
};

const storePath = async (path, chunkQueue) => {
    const stats = fs.statSync(path);
    if (stats.isFile()) {
        const buf = fs.readFileSync
        return await processFile(buf, chunkQueue);
    } else {
        return await processDirectory(path, chunkQueue);
    }
};

const store = async (path) => {
    let chunkQueue = [];
    const storeInfo = await storePath(path, chunkQueue);

    // At this point, we have chunkQueue, and storeInfo returned hash to us that is the root directory/file
    // Let's create the assignment
    const assignmentId = storeInfo.hash;
    const assignment = await Assignment.findByIdOrCreate(assignmentId);
    assignment.root_hash = storeInfo.hash;
    assignment.size = storeInfo.size;
    assignment.chunk_count = chunkQueue.length;
    assignment.desired_redundancy = config.client.defaultDesiredRedundancy; // todo: allow user to adjust
    assignment.achieved_redundancy = 0;
    assignment.desired_storage_duration = config.client.defaultDesiredStorageDuration; // todo: allow user to adjust
    assignment.is_active = false;
    await assignment.save();

    // Now add chunks
    const chunkEntries = [];
    let pos = 0;
    for (const chunkId of Object.values(chunkQueue)) { // don't use .map, it will skip -1 index
        chunkEntries.push({
            id: assignmentId + '_' + pos,
            assignment_id: assignmentId,
            pos,
            chunk_id: chunkId,
        });

        pos++;
    }
    await AssignmentChunk.bulkCreate(chunkEntries, {ignoreDuplicates: true});

    await Assignment.update({ is_active: true }, {
        where: { id: assignmentId }
    });

    // trigger assignment manager
    assignmentQueue.add(assignmentId);

    console.log(storeInfo);
    console.log({chunkQueue});
    return storeInfo;
};

module.exports = {
    store
};
