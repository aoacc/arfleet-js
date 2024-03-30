const fs = require('fs');
const nodepath = require('path');

const ao = () => {
    return require('./ao').getAoInstance();
}

const config = require('../config');

const loadLuaSourceFile = (filename) => {
    const thisScriptPath = __dirname;
    return fs.readFileSync(nodepath.join(thisScriptPath, '..', '..', '..', 'lua', filename), 'utf-8');
}

const spawnDeal = async(extra_lines) => {
    const thisScriptPath = __dirname;
    const sources = [
        loadLuaSourceFile('libs/hex.lua'),
        loadLuaSourceFile('libs/sha256.lua'),
        loadLuaSourceFile('libs/base64.lua'),
        loadLuaSourceFile('ArFleetDeal.lua'),
    ];

    const sources_concat = sources.join('\n\n');

    const process_id = await ao().spawn(sources_concat, [{name: "Name", value: "arfleet-deal"}]); // todo: why not working in explorer?

    await ao().sendAction(process_id, "Eval", extra_lines);

    return process_id;
}

const sendCollateral = async(process_id, collateral) => {
    await ao().sendAction(process_id, "SendCollateral", collateral);
}

module.exports = {
    spawnDeal,
    sendCollateral
}