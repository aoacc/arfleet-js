const config = require('../config');
const marketplace = require('../arweave/marketplace');

const announce = async(provider, connectionStrings = null) => {
    await marketplace.announce(provider, connectionStrings);

    const announcement = await marketplace.getAnnouncement(provider.address);

    console.log("Persisted Announcement:", announcement);
}

module.exports = {
    announce
}