const fs = require('fs');
const nodepath = require('path');

const ao = () => {
    return require('./ao').getAoInstance();
}

const config = require('../config');

const spawnDeal = async(extra_lines) => {
    const thisScriptPath = __dirname;
    const source_lua = fs.readFileSync(nodepath.join(thisScriptPath, '..', '..', '..', 'lua', 'TempweaveDeal.lua'), 'utf-8');
    const process_id = await ao().spawn(source_lua, [{name: "Name", value: "tw-deal"}])

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