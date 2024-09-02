const config = require('../config');
const { MINUTE } = require('../utils/constants');
const axios = require('axios');
const { getAoInstance } = require('./ao');
const { color } = require('../utils/color');
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

        if (firstTime) {
            console.log(Object.keys(passes).length.toString() + " ArFleet:Genesis passes found");
            if (ourAddress) {
                if (hasPass(ourAddress)) {
                    console.log(color("✅ You have an ArFleet:Genesis pass! 🎉", "green"));
                } else {
                    console.log("");
                    console.log(color("WARNING: You don't have an ArFleet:Genesis pass to participate in the testnet! 😢", "red"));
                    console.log("");
                    console.log(color("Providers/clients on testnet won't be able to connect to you without a valid pass.", "red"));
                    console.log("");
                    console.log(color("ArFleet:Genesis passes are this asset on Bazar: https://bazar.arweave.dev/#/asset/"+config.passes.address+"", "cyan"));
                    console.log("");
                    console.log(color("Send the pass to your address here: " + ourAddress, "cyan"));
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