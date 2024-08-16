class BackgroundQueue {
    constructor(
        {
            REBOOT_INTERVAL = 5 * 1000,
            addCandidates = async () => [],
            processCandidate = async () => {}
        },
        name = "unnamed-queue"
    ) {
        this.queue = [];
        this.running = false;
        this.addCandidates = addCandidates;
        this.processCandidate = processCandidate;
        this.REBOOT_INTERVAL = REBOOT_INTERVAL;
        this.name = name;
        this.boot();
    }

    // Start processing the queue
    async boot() {
        console.log(`Starting queue: ${this.name}`);
        this.running = true;
        while (this.running) {
            try {
                // Add new candidates to the queue
                const candidates = await this.addCandidates();
                this.queue.push(...candidates);

                // Process each candidate in the queue
                while (this.queue.length > 0) {
                    const candidate = this.queue.shift();
                    await this.processCandidate(candidate);
                }

                // Wait for the reboot interval before checking the queue again
                await this.sleep(this.REBOOT_INTERVAL);
            } catch (error) {
                console.error(`Error in queue ${this.name}:`, error);
            }
        }
    }

    add(id){
        this.queue.push(id);
    }
    // Utility function to pause execution for a given time
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = { BackgroundQueue };
