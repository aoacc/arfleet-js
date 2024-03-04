const nodepath = require('path');

const pathFromScriptToCwd = (x) => {
    const thisScriptPath = nodepath.dirname(process.argv[1]);
    const absolutePath = nodepath.resolve(nodepath.join(thisScriptPath, x));
    const cwd = process.cwd();
    const relativePath = nodepath.relative(cwd, absolutePath);
    return relativePath;
}

const makeMigration = () => {
    console.log("Making migration...")

    // A little hack: prepare sequelize-auto-migrations for reading from the current datadir config
    process.argv = [
        './tempweave',
        'makemigration',
        '--models-path',
        // 'dist/db/models',
        pathFromScriptToCwd('../src/db/models'),
        '--migrations-path',
        pathFromScriptToCwd('../src/migrations'),
        '--name',
        'automigration'
    ];

    const {Database} = require('../db/models');
    Database.init();

    require('sequelize-auto-migrations/bin/makemigration.js');

    return;
}

module.exports = {
    makeMigration
};