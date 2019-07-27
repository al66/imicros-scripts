"use strict";

const { ServiceBroker } = require("moleculer");
const { Deploy } = require("../index");
const { AclMixin } = require("imicros-acl");
const uuidv4 = require("uuid/v4");
const fs = require("fs");

const groupId = uuidv4();
const userId = uuidv4();

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
            service = await broker.createService(Deploy, Object.assign({ 
                name: "v1.deploy",
                mixins: [AclMixin,MinioMixinMock()],
                settings: {
                    path: "assets/"
                }
            }));
            await broker.start();
            expect(service).toBeDefined();
        });

    });
    
    describe("Test deploy a file", () => {

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
        
        it("it should deploy a file", async () => {
            let params = {
                "objectName": "service1.js",
                "name": "greeter.service.js"
            };
            return broker.call("v1.deploy.add", params, opts).then(res => {
                expect(res).toBeDefined();
                expect(res).toEqual({});
                expect(fs.existsSync("assets/"+groupId+"/greeter.service.js"));
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