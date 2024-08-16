class BackgroundQueue {
    constructor({ REBOOT_INTERVAL = 5 * 1000, addCandidates = async () => [], processCandidate = async () => {} }, name = "unnamed-queue") {
        this.queue = [];
        this.running = false;
        this.addCandidates = addCandidates;
        this.processCandidate = processCandidate;
        this.REBOOT_INTERVAL = REBOOT_INTERVAL;
        this.name = name;
        this.boot();
    }

    async boot() {
        if (this.running) {
            setTimeout(() => {
                this.boot();
            }, this.REBOOT_INTERVAL);
        }
        console.log(`booting queue ${this.name} with interval ${this.REBOOT_INTERVAL}`);
        // add candidates
        const candidates = await this.addCandidates();
        console.log(`[${this.name}] added ${candidates.length} candidates`);
        for (const candidate of candidates) {
            this.add(candidate);
        }

        // Ensure run is called if there are any candidates
        this.run(); // no await

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

        if (this.queue.length === 0) return;

        this.running = true;


        while (this.queue.length > 0) {
            try {
                const id = this.queue.shift();
                await this.processCandidate(id);
            }catch (e) {
                console.error(e);
            }
        }

        this.running = false;

        // schedule next run if more candidates could be added
        setTimeout(() => {
            this.run();
        }, 100);
    }
}

module.exports = { BackgroundQueue };
