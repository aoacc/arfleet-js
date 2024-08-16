const { Chunk } = require('./Chunk');
const { Assignment } = require('./Assignment');
const { AssignmentChunk } = require('./AssignmentChunk');
const { Placement } = require('./Placement');
const { PlacementChunk } = require('./PlacementChunk');

const { PSPlacement } = require('./PSPlacement');
const { PSPlacementChunk } = require('./PSPlacementChunk');

const {Database} = require('../index');
const sequelize = Database.client;

// Dependencies
// File.belongsToMany(Chunk, {through: FileMap});
// Chunk.belongsToMany(File, {through: FileMap});
// FileMap.belongsTo(Chunk);
// FileMap.belongsTo(File);
// File.hasMany(FileMap);
// Chunk.hasMany(FileMap);

AssignmentChunk.belongsTo(Assignment);
Assignment.hasMany(AssignmentChunk);

PlacementChunk.belongsTo(Placement);
Placement.hasMany(PlacementChunk);

Assignment.hasMany(Placement);
Placement.belongsTo(Assignment);

PSPlacementChunk.belongsTo(PSPlacement);
PSPlacement.hasMany(PSPlacementChunk);

module.exports = {
    Chunk,
    Assignment,
    AssignmentChunk,
    Placement,
    PlacementChunk,

    PSPlacement,
    PSPlacementChunk,

    Database,
    sequelize
};
