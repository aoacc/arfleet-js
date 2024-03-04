class BackgroundQueue {
    constructor({ REBOOT_INTERVAL = 5 * 1000, addCandidates = async () => [], processCandidate = async () => {} }) {
        this.queue = [];
        this.running = false;
        this.addCandidates = addCandidates;
        this.processCandidate = processCandidate;
        this.REBOOT_INTERVAL = REBOOT_INTERVAL;
        this.boot();
    }

    async boot() {
        if (this.running) return;
        this.running = true;
        
        // add candidates
        const candidates = await this.addCandidates();
        for (const candidate of candidates) {
            this.add(candidate);
        }

        this.running = false;
        
        // check from time to time
        setTimeout(() => {
            this.boot();
        }, this.REBOOT_INTERVAL);
    }
    
    add(id) {
        this.queue.push(id);
        this.run(); // no await
    }
    
    async run() {
        if (this.running) return;
        
        // before we make .processing = true, check if there's any work. if not, don't even bother
        if (this.queue.length === 0) return;

        this.running = true;

        while (this.queue.length > 0) {
            const id = this.queue.shift();
            await this.processCandidate(id);
        }

        this.running = false;

        // schedule next; will instantly quit if empty
        setTimeout(() => {
            this.run();
        }, 100);
    }
}

module.exports = BackgroundQueue;