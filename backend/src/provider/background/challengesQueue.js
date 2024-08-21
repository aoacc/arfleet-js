const { PSPlacement } = require('../../db/models');
const { PS_PLACEMENT_STATUS } = require('../../db/models/PSPlacement');
const Sequelize = require('sequelize');
const { BackgroundQueue } = require('../../utils/backgroundQueue');
const prepareChallengeResponse = require('./challengeResponse');

let challengesQueue = new BackgroundQueue({
    REBOOT_INTERVAL: 5 * 1000,
    addCandidates: async () => {
        const candidates = await PSPlacement.findAll({
            where: {
                status: PS_PLACEMENT_STATUS.COMPLETED,
                next_challenge: {
                    [Sequelize.Op.lt]: Date.now()
                }
            }
        });
        const ids = candidates.map(c => c.id);
        return ids;
    },
    processCandidate: async (placement_id) => {
        console.log('Processing challenge for placement: ', placement_id);

        const placement = await PSPlacement.findOrFail(placement_id);

        // create challenge
        const { getAoInstance } = require('../../arweave/ao');
        const challenge = await getAoInstance().sendAction(placement.process_id, 'GetChallenge', '');

        // if starts with Error:
        if (challenge.startsWith('Error:')) {
            console.log('Can\'t obtain challenge: ', challenge);
            if (challenge.contains('Not activated')){
                placement.status = PS_PLACEMENT_STATUS.FAILED;
                await placement.save();
            }
            return;
        }

        console.log('Challenge: ', challenge);
        const challengeResponse = await prepareChallengeResponse(placement, challenge);
        console.log('Challenge response: ', challengeResponse);

        const challengeResult = await getAoInstance().sendActionJSON(placement.process_id, 'SubmitChallenge', challengeResponse);
        console.log('Challenge result: ', challengeResult);

        const state = await getAoInstance().getState(placement.process_id);
        console.log('State: ', state);

        const nextChallenge = state["NextVerification"];
        placement.next_challenge = new Date(nextChallenge * 1000);
        await placement.save();
    }
}, 'challengesQueue');

module.exports = challengesQueue;
