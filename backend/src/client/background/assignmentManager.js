class AssignmentManager {
    constructor() {
        this.assignments = [];
        this.processing = false;
    }

    addAssignment(assignment_id) {
        this.assignments.push(assignment_id);
        this.processAssignments();
    }

    removeAssignment(assignment_id) {
        this.assignments = this.assignments.filter(a => a !== assignment_id);
    }

    getAssignments() {
        return this.assignments;
    }

    processAssignments() {
        if (this.processing) return;

        // before we make .processing = true, check if there's any work. if not, don't even bother
        if (this.assignments.length === 0) return;

        this.processing = true;

        console.log('Processing assignments');
        for (const assignment_id of this.assignments) {
            this.removeAssignment(assignment_id);
            this.processAssignment(assignment_id); // no await
        }

        this.processing = false;

        // schedule next
        setTimeout(() => {
            this.processAssignments();
        }, 100);
    }

    async processAssignment(assignment_id) {
        console.log('Processing assignment: ', assignment_id);
    }
}

let assignmentManager = new AssignmentManager();

module.exports = assignmentManager;