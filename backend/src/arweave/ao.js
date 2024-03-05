const config = require('../config');

const AOScheduler = config.aoScheduler;

const { connect, createDataItemSigner, result } = require("@permaweb/aoconnect");

const connection = connect(config.aoConfig);

const MAX_ATTEMPTS = 50;

class AOClient {
    constructor({ wallet }) {
        this.wallet = wallet;
        this.signer = createDataItemSigner(JSON.parse(wallet.readPrivateKey()));
    }

    async getResult(process_id, message, attempt = 0) {
        try {
            if (!attempt) attempt = 0;
    
            const resdata = await result({
                process: process_id,
                message: message,
            });
            return resdata;
        } catch (e) {
            if (attempt > MAX_ATTEMPTS) {
                throw e;
            } else {
                console.log("Retrying...");
                return getResult(process_id, message, attempt + 1);
            }
        }
    }

    async sendActionJSON(process_id, action, data, tags = {}, attempt = 0) {
        return await this.sendAction(process_id, action, JSON.stringify(data), tags, attempt);
    }
    
    async sendAction(process_id, action, data, tags = {}, attempt = 0) {
        try {
            if (!attempt) attempt = 0;
    
            console.log("sendAction", { action, data, tags });

            let t = [
                { name: "Action", value: action },
                { name: "Target", value: process_id }
            ];

            for (let key in tags) {
                t.push({ name: key, value: tags[key] });
            }

            const res = await connection.message({
                process: process_id,
                signer: this.signer,
                tags: t,
                data: data,
            });
    
            console.log({ res });
    
            const resdata = await this.getResult(process_id, res);

            if (resdata["Messages"] && resdata["Messages"].length > 0 && resdata["Messages"][0].Data) {
                const result = resdata["Messages"][0].Data;
                return result;
            } else {
                // Try Output.data
                if (resdata.Output && resdata.Output.data) {
                    if (resdata.Output.json && resdata.Output.json !== 'undefined') {
                        return JSON.parse(resdata.Output.json);
                    } else {
                        return resdata.Output.data.output;
                    }
                }
                console.log("Returning null!!!");
                console.log("resdata", resdata);
                return null;
            }

            // return resdata;
        } catch (e) {
            if (attempt > MAX_ATTEMPTS) {
                throw e;
            } else {
                console.log("Retrying action...");
                return this.sendAction(process_id, action, data, tags, attempt + 1);
            }
        }
    }
    
    async getInbox() {
        const resdata = await this.sendAction("Eval", "Inbox");
        const inbox = resdata.Output.data;
        // return inbox;
        const json = inbox.json;
        console.log({ json });
        return json;
    }

    async spawn(source_lua, tags=[]) {
        const res = await connection.spawn({
            module: config.aosModule,
            scheduler: AOScheduler,
            signer: this.signer,
            tags,
        });
    
        // - source code
        await this.sendAction(res, "Eval", source_lua);

        return res;
    }

    async sendToken(token, to, amount) {
        const res = await this.sendAction(token, "Transfer", "", { Recipient: to, Quantity: amount.toString() });
        return res;
    }

    async getState(process_id) {
        const ret = await this.sendAction(process_id, "GetState", "");
        try {
            return JSON.parse(ret);
        } catch(e) {
            console.error("Error parsing state", e);
            console.error("ret", ret);
            throw e;
        }
    }
}

let aoInstance;

function getAoInstance(initialState = null) {
    if(!aoInstance) {
        if (!initialState) throw new Error("AOClient is not initialized with a state");
        aoInstance = new AOClient(initialState);
    }
    
    return aoInstance;
}

module.exports = { getAoInstance };