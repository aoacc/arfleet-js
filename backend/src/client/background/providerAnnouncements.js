const marketplace = require('../../arweave/marketplace');
const config = require('../../config');
const axios = require('axios');

let announcements = [];

const checkAnnouncements = async() => {
    announcements = await marketplace.getAnnouncements();
    console.log("Announcements:", announcements);

    announcements = [];

    // And now check local announcements
    checkLocalAnnouncements();
}

const checkLocalAnnouncements = async() => {
    const port = config.provider.publicServer.port;
    const connectionStrings = [
        `http://localhost:${port}/announcement`,
        `https://p1.arfleet.io/announcement`,
        `https://p2.arfleet.io/announcement`,
        `https://p3.arfleet.io/announcement`,
    ];

    for (const connectionString of connectionStrings) {
        try {
            console.log("Looking for local announcement");
            const localAnnouncement = await axios.get(connectionString);
            if (localAnnouncement.data.announcement) {
                console.log("Local announcement:", localAnnouncement.data.announcement);
                announcements[localAnnouncement.data.announcement.ProviderId] = localAnnouncement.data.announcement;
                console.log("Announcements:", announcements);
            } else {
                console.log("No local announcement found");
            }
        } catch(e) {
            console.log("No local announcement found"/*, e*/);
            // Do nothing
        }
    }
}

const startChecking = async() => {
    checkAnnouncements();

    // Leave default value here so it doesn't become 0 if unset
    setInterval(checkAnnouncements, config.client.fetchAnnouncementsInterval || 1 * 60 * 1000);
}

// todo: validate the announcement schema, because some bugs might come from there (parsing it, default values etc.)
const getProvidersToConnect = () => {
    let result = [];
    for (const [provider, announcement] of Object.entries(announcements)) {
        result.push({
            address: provider,
            connectionStrings: announcement["ConnectionStrings"],
            storageCapacity: announcement["Storage-Capacity"],
            storagePriceDeal: announcement["Storage-Price-Deal"],
            storagePriceUploadKBSec: announcement["Storage-Price-Upload-KB-Sec"],
            minChallengeDuration: announcement["Min-Challenge-Duration"],
            minStorageDuration: announcement["Min-Storage-Duration"],
            maxStorageDuration: announcement["Max-Storage-Duration"],
            // todo: report version
            // todo: if any of the values are missing or wrong, invalidate
        })
    }
    return result;
}

module.exports = {
    startChecking,
    announcements,
    getProvidersToConnect,
}