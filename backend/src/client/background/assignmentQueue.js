const { Assignment, Placement } = require('../../db/models');
const { placementQueue } = require('./placementQueue');
const announcements = require('./providerAnnouncements');
const Sequelize = require('sequelize');
const { BackgroundQueue } = require('../../utils/backgroundQueue');
const config = require('../../config');

let verifyProviderConstraints = (provider, assignment) => {
    // Storage Capacity
    const storageCapacity = provider.storageCapacity;
    const assignmentSize = assignment.size;
    if (assignmentSize > storageCapacity) {
        console.log('Assignment size is greater than provider storage capacity');
        return false;
    }

    // Max Storage Duration
    const maxStorageDuration = provider.maxStorageDuration;
    const desiredStorageDuration = assignment.desired_storage_duration;
    if (desiredStorageDuration > maxStorageDuration) {
        console.log('Desired storage duration is greater than max storage duration by provider');
        return false;
    }

    // Min Storage Duration
    const minStorageDuration = provider.minStorageDuration;
    if (desiredStorageDuration < minStorageDuration) {
        console.log('Desired storage duration is less than min storage duration by provider');
        return false;
    }

    // Challenge Duration
    const providerMinChallengeDuration = provider.minChallengeDuration;
    const clientMaxChallengeDuration = config.client.defaultChallengeDuration; // allow user to adjust
    if (providerMinChallengeDuration > clientMaxChallengeDuration) {
        console.log('Provider min challenge duration is greater than client max challenge duration');
        return false;
    }

    // Storage Price
    const storagePriceDeal = provider.storagePriceDeal;
    const storagePriceUploadKBSec = provider.storagePriceUploadKBSec;
    // todo: negotiate on prices

    // todo: sanity check the values

    return true;
};

let assignmentQueue = new BackgroundQueue({
    REBOOT_INTERVAL: 5 * 1000,
    addCandidates: async () => {
        const candidates = await Assignment.findAll({
            where: {
                is_active: true,
                achieved_redundancy: {
                    [Sequelize.Op.lt]: Sequelize.col('desired_redundancy')
                }
            }
        });
        const ids = candidates.map(c => c.id);
        return ids;
    },
    processCandidate: async (assignment_id) => {
        console.log('Processing assignment: ', assignment_id);

        const assignment = await Assignment.findOrFail(assignment_id);
        // console.log('Assignment: ', assignment);

        if (assignment.desired_redundancy > assignment.achieved_redundancy) {
            // try to find a matching provider
            console.log(`Redundancy for ${assignment_id} not achieved (${assignment.achieved_redundancy}/${assignment.desired_redundancy}), trying to find a matching provider`);

            let providersToConnect = announcements.getProvidersToConnect()
                                                  .sort(() => Math.random() - 0.5); // todo: instead of random shuffle, order based on price, connectivity, reputation etc.

            if (providersToConnect.length === 0) {
                console.log('No providers to connect');
                return;
            }

            for (const provider of providersToConnect) {
                // Make sure we didn't try this one already
                const count = await Placement.count({
                    where: {
                        id: assignment.id + '_' + provider.address
                    }
                });

                // console.log(await Placement.allBy('id', assignment.id + '_' + provider.address));

                console.log('Count: ', count);
                if (count > 0) {
                    // update connection strings
                    const placement = await Placement.findOneByOrFail('id', assignment.id + '_' + provider.address);
                    placement.provider_connection_strings = (provider.connectionStrings || '').split('|');
                    await placement.save();

                    // console.log('Already tried this provider');
                    // todo: retry after some time
                    continue;
                }

                // Verify the constraints
                const valid = verifyProviderConstraints(provider, assignment);
                if (!valid) {
                    console.log('Provider constraints not met');
                    continue;
                }

                // Create the link
                const placement = await Placement.create({
                    id: assignment.id + '_' + provider.address,
                    assignment_id: assignment.id,
                    provider_id: provider.address,
                    provider_connection_strings: (provider.connectionStrings || '').split('|'),
                });

                placementQueue.add(placement.id);
            }
        }
    }
});

module.exports = assignmentQueue;
