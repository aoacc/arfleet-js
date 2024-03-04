const { Assignment, Placement } = require('../../db/models');
const placementManager = require('./placementManager');
const announcements = require('./providerAnnouncements');
const Sequelize = require('sequelize');

class AssignmentManager {
    constructor() {
        this.assignments = [];
        this.processing = false;
        this.boot();
    }

    async boot() {
        if (this.processing) return;

        this.processing = true;

        // find those with desired_redundancy > achieved_redundancy
        const assignments = await Assignment.findAll({
            where: {
                desired_redundancy: {
                    [Sequelize.Op.gt]: Sequelize.col('achieved_redundancy')
                }
            }
        });

        for (const assignment of assignments) {
            this.addAssignment(assignment.id);
        }

        this.processing = false;
        this.processAssignments(); // no await
        // check from time to time
        setTimeout(() => {
            this.boot();
        }, 5 * 1000);
    }

    addAssignment(assignment_id) {
        this.assignments.push(assignment_id);
        this.processAssignments(); // no await
    }

    removeAssignment(assignment_id) {
        this.assignments = this.assignments.filter(a => a !== assignment_id);
    }

    getAssignments() {
        return this.assignments;
    }

    async processAssignments() {
        if (this.processing) return;

        // before we make .processing = true, check if there's any work. if not, don't even bother
        if (this.assignments.length === 0) return;

        this.processing = true;

        console.log('Processing assignments');
        for (const assignment_id of this.assignments) {
            this.removeAssignment(assignment_id);
            await this.processAssignment(assignment_id); // no await
        }

        this.processing = false;

        // schedule next
        setTimeout(() => {
            this.processAssignments();
        }, 100);
    }

    async processAssignment(assignment_id) {
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
                if (count > 0) {
                    // update connection strings
                    const placement = await Placement.findOneByOrFail('id', assignment.id + '_' + provider.address);
                    placement.provider_connection_strings = (provider.connectionStrings || '').split('|');
                    await placement.save();

                    console.log('Already tried this provider'); // todo: retry after some time
                    continue;
                }

                // Create the link
                const placement = await Placement.create({
                    id: assignment.id + '_' + provider.address,
                    assignment_id: assignment.id,
                    provider_id: provider.address,
                    provider_connection_strings: (provider.connectionStrings || '').split('|'),
                });

                placementManager.addPlacement(placement.id);
            }
        }
    }
}

let assignmentManager = new AssignmentManager();

module.exports = assignmentManager;