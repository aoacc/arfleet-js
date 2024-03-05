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

        console.log('Challenge: ', challenge);
        const challengeResponse = await prepareChallengeResponse(placement, challenge);
        console.log('Challenge response: ', challengeResponse);

        const challengeResult = await getAoInstance().sendAction(placement.process_id, 'SubmitChallenge', '');
        console.log('Challenge result: ', challengeResult);

        process.exit(0);
    }
});

module.exports = challengesQueue;