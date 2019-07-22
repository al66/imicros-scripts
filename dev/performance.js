"use strict";

const { ServiceBroker } = require("moleculer");
const { Scripts } = require("../index");
const { AclMixin } = require("imicros-acl");
const fs = require("fs");

const timestamp = Date.now();

// mock imicros-minio mixin
const MinioMixinMock = () => { return {
    methods: {
        async getStream ({ objectName = null } = {}) {
            return fs.createReadStream("assets/" + objectName);
        },
        async putStream ({ objectName = null, stream = null } = {}) {
            let fstream = fs.createWriteStream("assets/" + objectName);
            await stream.pipe(fstream);
        },
        async getSync ({ objectName = null} = {}) {
            let fstream = fs.createReadStream("assets/" + objectName);
            async function receive(stream) {
                let promise = await new Promise((resolve,reject) => {
                    let buffers = [];
                    stream.on("data", (chunk) => {
                        buffers.push(chunk);
                    });
                    stream.on("close", () => {
                        try {
                            resolve(buffers.concat());
                        } catch (err) {
                            reject(err);
                        }
                    });
                });
                return promise;
            }
            return receive(fstream);
        }
    }
};};

let main = async () => {
    let broker;

    broker = new ServiceBroker({
        logger: console,
        logLevel: "info" //"debug"
    });
    await broker.createService(Scripts, Object.assign({ 
        name: "v1.scripts",
        mixins: [AclMixin, MinioMixinMock()]
    }));
    await broker.start();

    let opts = { 
        meta: { 
            acl: {
                accessToken: "this is the access token",
                ownerId: `g1-${timestamp}`,
                unrestricted: true
            }, 
            user: { 
                id: `1-${timestamp}` , 
                email: `1-${timestamp}@host.com` }, 
            access: [`1-${timestamp}`, `2-${timestamp}`] 
        } 
    };

    let start = Date.now();
    let received = 0;
    for (let i=0; i<1; i++ ) {
        opts.meta.scriptName = "script1.js";
        let params = {
            test1: "input test1 ",
            test2: "input test2 ",
            test3: 4,
            test4: 7
        };
        await broker.call("v1.scripts.run", params, opts).then(res => {
            console.log(res);
            if (res.sum === 11) received++;
        });
    }
    await broker.logger.info("Performance:", { consumed: Date.now() - start, received: received });
    
    await broker.stop();
    
};
main();