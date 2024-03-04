const config = require('../config');

const AOScheduler = config.aoScheduler;

const { connect, createDataItemSigner, result } = require("@permaweb/aoconnect");

const connection = connect(config.aoConfig);

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
            if (attempt > 10) {
                throw e;
            } else {
                console.log("Retrying...");
                return getResult(process_id, message, attempt + 1);
            }
        }
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
                data: JSON.stringify(data),
            });
    
            console.log({ res });
    
            const resdata = await this.getResult(process_id, res);

            if (resdata["Messages"] && resdata["Messages"].length > 0 && resdata["Messages"][0].Data) {
                const result = resdata["Messages"][0].Data;
                return result;
            } else {
                console.log({ resdata });
                return null;
            }

            // return resdata;
        } catch (e) {
            if (attempt > 3) {
                throw e;
            } else {
                console.log("Retrying action...");
                return this.sendAction(process_id, action, data, tags, attempt + 1);
            }
        }
    }
    
    async sendActionExtra(process_id, action, data, extra, attempt) {
        try {
            if (!attempt) attempt = 0;
    
            let tags =
                [
                    { name: "Action", value: action },
                    { name: "Target", value: process_id }
                ];
    
            for (let key in extra) {
                tags.push({ name: key, value: extra[key] });
            }
    
            console.log("sendActionExtra", { action, data, extra });
    
            const res = await connection.message({
                process: process_id,
                signer: this.signer,
                tags,
                data: data,
            });
    
            console.log({ action, data, res });
    
            const resdata = await this.getResult(process_id, res);
    
            console.log({ resdata });
            return resdata;
        } catch (e) {
            if (attempt > 3) {
                throw e;
            } else {
                console.log("Retrying action...");
                return this.sendActionExtra(process_id, action, data, extra, attempt + 1);
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
}

// async function doSpawn() {
//     spawned = true;

//     const signer = createDataItemSigner(window.arweaveWallet);

//     PROCESS_ID = '4nun5UrnY1Jz_kdCZNxaINchEBWnKIZ_n1r9n2dNPYQ';
//     return;

//     const res = await connection.spawn({
//         module: AOModule,
//         scheduler: AOScheduler,
//         signer,
//         tags: [],
//     });

//     console.log(res);
//     PROCESS_ID = res;

//     console.log('PROCESS_ID', PROCESS_ID);

//     // - source code

//     const sourceLuaCodeResponse = await fetch(window.source_lua);
//     const sourceLuaCode = await sourceLuaCodeResponse.text();

//     // const lines = sourceLuaCode.split("\n\n");
//     // console.log({sourceLuaCode});
//     // for (let line of lines) {
//     //     console.log({line});
//     //     const res = await sendAction("Eval", line);
//     //     console.log({res});
//     // }
//     await sendAction("Eval", sourceLuaCode);
// }


let aoInstance;

function getAoInstance(initialState = null) {
    if(!aoInstance) {
        if (!initialState) throw new Error("AOClient is not initialized with a state");
        aoInstance = new AOClient(initialState);
    }
    
    return aoInstance;
}

module.exports = { getAoInstance };