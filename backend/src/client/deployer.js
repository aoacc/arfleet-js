const fs = require("fs");
const nodepath = require("path");
const utils = require("../utils");

const processFile = async (path) => {
    // {"type": "file", "path": filePath, "size": size}
    
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