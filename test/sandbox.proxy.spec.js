"use strict";

const { ServiceBroker } = require("moleculer");
const ApiGateway = require("moleculer-web");
const { Proxy } = require("../index");
const request = require("request");
const req = require("supertest");
const uuidv4 = require("uuid/v4");
const fs = require("fs");
const stream = require("stream");

const userId = uuidv4();
const groupId = uuidv4();

const sandboxService = {
    version: "v1",
    name: "myService",
    actions: {
        myAction: {
            handler(ctx) {  
                if (ctx.params instanceof stream.Stream) {
                    this.broker.logger.debug("Call to myAction", { params: "stream" } );
                } else {
                    this.broker.logger.debug("Call to myAction", { params: ctx.params } );
                }
                return ctx.params;
            }
        }
    }
};

describe("Test deploy service", () => {

    let broker, service, sandbox;
    beforeAll(() => {
    });
    
    afterAll(() => {
    });
    
    describe("Test create service", () => {

        it("it should start the broker", async () => {
            broker = new ServiceBroker({
                logger: console,
                logLevel: "debug" // "info" //"debug"
            });
            service = await broker.createService(ApiGateway, Object.assign({ 
                name: "v1.gateway",
                mixins: [Proxy],
                settings: {
                    routes: [{
                        path: "/sandbox/upload",
                        aliases: {
                            "/:sandboxServiceVersion?/:sandboxService/:sandboxAction"(  req, res){
                                this.routeToSandbox(req,res,true);
                            }                            
                        },
                        bodyParsers: {
                            json: false
                        },
                        busboyConfig: {
                            limits: {
                                files: 1
                            }
                        },
                        mergeParams: false,
                        authorization: true
                    },{
                        path: "/sandbox",
                        aliases: {
                            "/:sandboxServiceVersion?/:sandboxService/:sandboxAction"(  req, res){
                                this.routeToSandbox(req,res);
                            }                            
                        },
                        bodyParsers: {
                            json: false
                        },
                        mergeParams: false,
                        authorization: true
                    },{
                        path: "/" + groupId + "/",
                        bodyParsers: {
                            json: true
                        },
                        mergeParams: true
                    },{
                        path: "/" + groupId + "/upload",
                        aliases: {
                            "v1/myService/myAction":"stream:v1.myService.myAction"
                        },
                        bodyParsers: {
                            json: false,
                            urlencoded: false
                        },
                        busboyConfig: {
                            limits: {
                                files: 1
                            }
                        },
                        mergeParams: true
                    }],
                    sandbox: {
                        baseUrl: "http://localhost:3000/"
                    }
                },
                methods: {
                    authorize(ctx /*, route, req, res */) {
                        ctx.meta = { 
                            acl: {
                                accessToken: "this is the access token",
                                ownerId: groupId,
                                unrestricted: true
                            }, 
                            user: { 
                                id: userId , 
                                email: `${userId}@host.com`
                            }
                        };
                    }
                }
            }));
            sandbox = await broker.createService(sandboxService);
            await broker.start();
            expect(service).toBeDefined();
            expect(sandbox).toBeDefined();
        });

    });
 
    describe("Test call gateway", () => {

        //let opts;
        
        beforeEach(() => {
            /*
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
            */
        });
        
        it("it should return true", async () => {
            let params = {
                "objectName": "service1.js",
                "filename": "greeter.service.js"
            };
            let options = {
                uri: "http://localhost:3000/sandbox/v1/myService/myAction?test=myQueryParameter",
                method: "POST",
                json: params
            };
            function call() {
                return new Promise((resolve, reject) => {
                    request(options)
                    .on("response", (res) => resolve(res))
                    .on("error", (err) => reject(err));
                });
            }
            await call();
            
        });
        
        it("it should return true", async () => {
            let options = {
                uri: "http://localhost:3000/sandbox/v1/myService/myAction?test=myQueryParameter",
                method: "GET"
            };
            function call() {
                return new Promise((resolve, reject) => {
                    request(options)
                    .on("response", (res) => resolve(res))
                    .on("error", (err) => reject(err));
                });
            }
            await call();
            

        });
        
        it("it should upload file as stream", () => {
            let buffer = fs.readFileSync("assets/imicros.png");
            return req("http://localhost:3000")
                .put("/sandbox/upload/v1/myService/myAction")
                .set("x-imicros-mimetype","image/png")
                .send(buffer)
                .then(res => {
                    expect(res.statusCode).toBe(200);
                    //expect(res.body).toEqual(expect.objectContaining({ objectName: "imicros.png" }));
                    //console.log(res.body);
                });
            
        });
        
        /*
        it("it should remove the file again", async () => {
            let params = {
                "filename": "greeter.service.js"
            };
            return broker.call("v1.deploy.remove", params, opts).then(res => {
                expect(res).toBeDefined();
                expect(res).toEqual({ removed: "greeter.service.js" });
                expect(!fs.existsSync("assets/"+groupId+"/greeter.service.js"));
            });
        });
        */
      
    });
    
    describe("Test stop broker", () => {
        it("should stop the broker", async () => {
            expect.assertions(1);
            await broker.stop();
            expect(broker).toBeDefined();
        });
    });    
    
});