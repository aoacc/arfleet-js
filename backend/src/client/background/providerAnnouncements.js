const CHECK_INTERVAL = 1000 * 60 * 5; // 5 minutes

const marketplace = require('../../arweave/marketplace');

let announcements = [];

const checkAnnouncements = async() => {
    announcements = await marketplace.getAnnouncements();
    console.log("Announcements:", announcements);
}

const startChecking = async() => {
    checkAnnouncements();
    setInterval(checkAnnouncements, CHECK_INTERVAL);
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