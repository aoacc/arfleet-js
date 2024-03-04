// import File from './file';
// const Identity = require('./identity');
const Chunk = require('./Chunk');
const Assignment = require('./Assignment');
const AssignmentChunkMap = require('./AssignmentChunkMap');
// import FileMap from './file_map';
// import DirMap from './dir_map';
// import {Database} from '../index';
const {Database} = require('../index');
const sequelize = Database.client;

// Dependencies
// File.belongsToMany(Chunk, {through: FileMap});
// Chunk.belongsToMany(File, {through: FileMap});
// FileMap.belongsTo(Chunk);
// FileMap.belongsTo(File);
// File.hasMany(FileMap);
// Chunk.hasMany(FileMap);

AssignmentChunkMap.belongsTo(Assignment);
Assignment.hasMany(AssignmentChunkMap);

// export {File, Identity, Chunk, Database, FileMap, DirMap, sequelize};
module.exports = {
    Chunk,
    Assignment,
    AssignmentChunkMap,

    Database,
    sequelize
};