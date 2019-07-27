"use strict";

const { ServiceBroker } = require("moleculer");
const { Sandbox } = require("../index");
const { AclMixin } = require("imicros-acl");
const uuidv4 = require("uuid/v4");

const groupId = uuidv4();
const userId = uuidv4();

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
            service = await broker.createService(Sandbox, Object.assign({ 
                name: "v1.sandbox",
                mixins: [AclMixin],
                settings: {
                    docker: {host: "http://192.168.2.124", port: 4243}
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
        
        
    });
    
    describe("Test stop broker", () => {
        it("should stop the broker", async () => {
            expect.assertions(1);
            await broker.stop();
            expect(broker).toBeDefined();
        });
    });    
    
});