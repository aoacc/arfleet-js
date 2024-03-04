const ao = require('./ao').getAoInstance();
const config = require('../config');

const announce = async(provider, connectionStrings = null) => {
    if (connectionStrings) {
        provider.connectionStrings = connectionStrings;
    } else {
        connectionStrings = provider.connectionStrings;
    }

    console.log(`Announcing from ${provider.address}, URL are ${provider.connectionStrings}`);

    await ao.sendAction(config.marketplace, "Announce", {
        "Connection-Strings": provider.connectionStrings,
        "Storage-Capacity": await provider.getCapacity()
    });
}

const getAnnouncement = async(provider_id) => {
    const ret = await ao.sendAction(config.marketplace, "Get-Announcement", {"Provider": provider_id});
    return JSON.parse(ret["Data"]);
}

module.exports = {
    announce,
    getAnnouncement
}