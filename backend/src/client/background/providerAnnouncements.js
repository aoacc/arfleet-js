const marketplace = require('../../arweave/marketplace');
const config = require('../../config');
const axios = require('axios');

let announcements = [];

const checkAnnouncements = async() => {
    announcements = await marketplace.getAnnouncements();
    console.log("Announcements:", announcements);

    // And now check local announcements
    checkLocalAnnouncements();
}

const checkLocalAnnouncements = async() => {
    const port = config.provider.publicServer.port;
    try {
        console.log("Looking for local announcement");
        const localAnnouncement = await axios.get(`http://localhost:${port}/announcement`);
        if (localAnnouncement.data.announcement) {
            console.log("Local announcement:", localAnnouncement.data.announcement);
            announcements[localAnnouncement.data.announcement.ProviderId] = localAnnouncement.data.announcement;
            console.log("Announcements:", announcements);
        } else {
            console.log("No local announcement found");
        }
    } catch(e) {
        console.log("No local announcement found", e);
        // Do nothing
    }
}

const startChecking = async() => {
    checkAnnouncements();

    // Leave default value here so it doesn't become 0 if unset
    setInterval(checkAnnouncements, config.client.fetchAnnouncementsInterval || 1 * 60 * 1000);
}

const getProvidersToConnect = () => {
    let result = [];
    for (const [provider, announcement] of Object.entries(announcements)) {
        result.push({
            address: provider,
            connectionStrings: announcement["ConnectionStrings"]
        })
    }
    return result;
}

module.exports = {
    startChecking,
    announcements,
    getProvidersToConnect,
}