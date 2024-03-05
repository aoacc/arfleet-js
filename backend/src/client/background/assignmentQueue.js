const { Assignment, Placement } = require('../../db/models');
const { placementQueue } = require('./placementQueue');
const announcements = require('./providerAnnouncements');
const Sequelize = require('sequelize');
const { BackgroundQueue } = require('./backgroundQueue');

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
        console.log('Assignment: ', assignment);

        if (assignment.desired_redundancy > assignment.achieved_redundancy) {
            // try to find a matching provider
            console.log('Redundancy not achieved, trying to find a matching provider');

            const providersToConnect = announcements.getProvidersToConnect();

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

                console.log(await Placement.allBy('id', assignment.id + '_' + provider.address));

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