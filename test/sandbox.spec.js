"use strict";

const { ServiceBroker } = require("moleculer");
const { Sandbox } = require("../index");
const { AclMixin } = require("imicros-acl");
const uuidv4 = require("uuid/v4");
const groupId = uuidv4();
const userId = uuidv4();
const image = "my-own-image";

let docker = null;
if (process.env.LOCAL_DOCKER) docker = {host: "http://192.168.2.124", port: 4243};

async function init() {
    await require("./helper/init").init({ host: docker, mountPath: process.env.MOUNT_PATH || "", owner: groupId, image: image });
}

describe("Test sandbox service", () => {

    let broker, service;
    beforeAll(() => {
        return new Promise(async (resolve, reject) => {
            await init();
            console.log("Init done");
            resolve();
        });
    });
    
    afterAll(() => {
    });
    
    describe("Test create service", () => {

        it("it should start the broker", async () => {
            broker = new ServiceBroker({
                logger: console,
                logLevel: "debug" //"info" //"debug"
            });
            service = await broker.createService(Sandbox, Object.assign({ 
                name: "v1.sandbox",
                mixins: [AclMixin],
                settings: {
                    docker: docker,
                    container: {
                        image: image
                    },
                    mount: {
                        path: process.env.MOUNT_PATH || ""
                    }
                }
            }));
            await broker.start();
            expect(service).toBeDefined();
        });

    });
    
    describe("Test launch sandbox", () => {

        let opts;
        
        beforeEach(() => {
            opts = { 
                meta: { 
                    acl: {
                        accessToken: "this is the access token",
                        ownerId: groupId,
                        unrestricted: true
                    }, 
                    user: { 
                        id: userId , 
                        email: `${userId}@host.com` }
                } 
            };
        });
        
        it("it should lauch a sandbox", async () => {
            let params = {
            };
            return broker.call("v1.sandbox.launch", params, opts).then(res => {
                expect(res).toBeDefined();
                expect(res).toEqual({});
            });
        });
        
        it("it should return the status running", async () => {
            let params = {
            };
            return broker.call("v1.sandbox.status", params, opts).then(res => {
                expect(res).toBeDefined();
                expect(res[0].status).toEqual("running");
            });
        });
        
        it("it should stop the sandbox", async () => {
            let params = {
            };
            return broker.call("v1.sandbox.stop", params, opts).then(res => {
                expect(res).toBeDefined();
                expect(res).toEqual(true);
            });
        });
        
        it("it should return the status stopped", async () => {
            let params = {
            };
            return broker.call("v1.sandbox.status", params, opts).then(res => {
                expect(res).toBeDefined();
                expect(res[0].status).toEqual("stopped");
            });
        });
        
        it("it should start the sandbox again", async () => {
            let params = {
            };
            return broker.call("v1.sandbox.start", params, opts).then(res => {
                expect(res).toBeDefined();
                expect(res).toEqual(true);
            });
        });
        
        it("it should return the status running", async () => {
            let params = {
            };
            return broker.call("v1.sandbox.status", params, opts).then(res => {
                expect(res).toBeDefined();
                expect(res[0].status).toEqual("running");
            });
        });

        it("it should pause the sandbox", async () => {
            let params = {
            };
            return broker.call("v1.sandbox.pause", params, opts).then(res => {
                expect(res).toBeDefined();
                expect(res).toEqual(true);
            });
        });
        
        it("it should return the status paused", async () => {
            let params = {
            };
            return broker.call("v1.sandbox.status", params, opts).then(res => {
                expect(res).toBeDefined();
                expect(res[0].status).toEqual("paused");
            });
        });

        it("it should resume the sandbox", async () => {
            let params = {
            };
            return broker.call("v1.sandbox.resume", params, opts).then(res => {
                expect(res).toBeDefined();
                expect(res).toEqual(true);
            });
        });

        it("it should return the status running", async () => {
            let params = {
            };
            return broker.call("v1.sandbox.status", params, opts).then(res => {
                expect(res).toBeDefined();
                expect(res[0].status).toEqual("running");
            });
        });

        it("it should remove the sandbox", async () => {
            let params = {
            };
            return broker.call("v1.sandbox.remove", params, opts).then(res => {
                expect(res).toBeDefined();
                expect(res).toEqual(true);
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