const config = require('../config');
const { MINUTE } = require('../utils/constants');
const axios = require('axios');
const { getAoInstance } = require('./ao');

let passes = null;

const checkPasses = async(firstTime = false, ourAddress = null) => {
    console.log("Checking passes...");
    try {
        const passAddress = config.passes.address;
    
        const ao = getAoInstance();
        const response = await ao.dryRun(passAddress, "Info");

        const passesReturned = response.Balances;

        const passesDestringified = Object.fromEntries(
            Object.entries(passesReturned).map(([key, value]) => [key, Number(value)])
        );

        const passesFiltered = Object.fromEntries(
            Object.entries(passesDestringified).filter(([key, value]) => value > 0)
        );

        passes = passesFiltered;
        // console.log({passes});

        if (firstTime) {
            console.log(Object.keys(passes).length.toString() + " ArFleet:Genesis passes found");
            if (ourAddress) {
                if (hasPass(ourAddress)) {
                    console.log("\x1b[32m✅ You have an ArFleet:Genesis pass! 🎉\x1b[0m");
                } else {
                    console.log("");
                    console.log("\x1b[31mWARNING: You don't have an ArFleet:Genesis pass to participate in the testnet! 😢\x1b[0m");
                    console.log("");
                    console.log("Providers/clients on testnet won't be able to connect to you without a valid pass.");
                    console.log("");
                    console.log("\x1b[31mArFleet:Genesis passes are this asset on Bazar: https://bazar.arweave.dev/#/asset/"+config.passes.address+"\x1b[0m");
                    console.log("");
                    console.log("Send the pass to your address here: " + ourAddress);
                }
            }
        }

        // Success!
    } catch(e) {
        console.error(e);
    }
}

const hasPass = (address) => {
    return passes && passes[address] && passes[address] > 0;
}

const startChecking = async(ourAddress = null) => {
    await checkPasses(true, ourAddress);

    // Leave default value here so it doesn't become 0 if unset
    setInterval(checkPasses, config.fetchPassesInterval || 5 * MINUTE);
}

const getPasses = () => {
    return passes;
}

module.exports = {
    startChecking,
    getPasses,
    hasPass
}