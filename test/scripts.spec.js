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

describe("Test scripts service", () => {

    let broker, service;
    beforeAll(() => {
    });
    
    afterAll(() => {
    });
    
    describe("Test create service", () => {

        it("it should start the broker", async () => {
            broker = new ServiceBroker({
                logger: console,
                logLevel: "info" //"debug"
            });
            service = await broker.createService(Scripts, Object.assign({ 
                name: "v1.scripts",
                mixins: [AclMixin, MinioMixinMock()]
            }));
            await broker.start();
            expect(service).toBeDefined();
        });

    });
    
    describe("Test run", () => {

        let opts;
        
        beforeEach(() => {
            opts = { 
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
        });
        
        it("it should run script1", async () => {
            opts.meta.scriptName = "script1.js";
            let params = {
                test1: "input test1 ",
                test2: "input test2 ",
                test3: 4,
                test4: 7
            };
            return broker.call("v1.scripts.run", params, opts).then(res => {
                expect(res).toBeDefined();
                expect(res.meta).toEqual(opts.meta);
                expect(res.params).toEqual(params);
                expect(res.sum).toEqual(11);
            });
        });

        it("it should get timeout running script2", async () => {
            opts.meta.scriptName = "script2.js";
            let params = {
            };
            return broker.call("v1.scripts.run", params, opts).then(res => {
                expect(res).toBeDefined();
            })
            .catch((err) => {
                expect(err.message).toEqual("Script execution timed out.");
            });
        });

        it("it should run script3", async () => {
            opts.meta.scriptName = "script3.js";
            let params = {
            };
            return broker.call("v1.scripts.run", params, opts).then(res => {
                expect(res).toBeDefined();
                expect(res.meta).toEqual(opts.meta);
                expect(res.params).toEqual(params);
                expect(res.sum).toEqual(17);
            });
        });
        
        it("it should run script4", async () => {
            opts.meta.scriptName = "script4.js";
            let params = {
            };
            return broker.call("v1.scripts.run", params, opts).then(res => {
                expect(res).toBeDefined();
                expect(res.test1).toEqual(11);
                expect(res.test2).toEqual(6);
            });
        });
        
    });
    
    describe("Test stop broker", () => {
        it("should stop the broker", async () => {
            expect.assertions(1);
            await broker.stop();
            expect(broker).toBeDefined();
        });
    });    
    
});