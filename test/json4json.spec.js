"use strict";

const { ServiceBroker } = require("moleculer");
const { Json4json } = require("../index");
const { AclMixin } = require("imicros-acl");

const timestamp = Date.now();

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
                logLevel: "debug" // "info" //"debug"
            });
            service = await broker.createService(Json4json, Object.assign({ 
                name: "v1.json4json",
                mixins: [AclMixin]
            }));
            await broker.start();
            expect(service).toBeDefined();
        });

    });
    
    describe("Test json4json", () => {

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
        
        it("it should run template", async () => {
            let params = {
                template: "{{val}}",
                data: {val: 1}
            };
            return broker.call("v1.json4json.transform", params, opts).then(res => {
                expect(res).toBeDefined();
                expect(res).toEqual(1);
            });
        });

        it("it should run more complex template", async () => {
            let params = {
                template: {var1: "{{val1}}", var2: "{{val2}}", sum: "{{val1 + val2}}" },
                data: {
                    val1: 1,
                    val2: 5
                }
            };
            return broker.call("v1.json4json.transform", params, opts).then(res => {
                expect(res).toBeDefined();
                expect(res).toEqual({var1: 1, var2: 5, sum: 6});
            });
        });

        it("it should run template with build in functions", async () => {
            let params = {
                template: {result: { "{{#if Math.round(num) === 10}}": "if", "{{#elseif $root.num > 10}}": "elseif", "{{#else}}": "else" } },
                data: {
                    num: 10.6
                }
            };
            return broker.call("v1.json4json.transform", params, opts).then(res => {
                expect(res).toBeDefined();
                expect(res).toEqual({result: "elseif"});
            });
        });

        it("it should run complete example template from json4json package", async () => {
            let params = {
                template: {
                    simpleValue: "{{value}}",
                    optionalValue: "{{#? optionalValue}}",
                    iteration: {
                        object: {
                            "{{#each object}}": ["{{$key}}", "{{$item.example}}", "{{keyInItem}}"]
                        },
                        array: {
                            "{{#each array}}": ["{{$key}}", "{{$item.example}}", "{{keyInItem}}"]
                        }
                    },
                    conditions: {
                        "{{#if Math.round(num) === 10}}": "if",
                        "{{#elseif $root.num > 10}}": "elseif",
                        "{{#else}}": "else"
                    },
                    mergeObjects: {
                        "{{#merge}}": [
                      { a: 1, b: 1, c: 1 },
                      { b: 2, c: 2 },
                            {
                                "{{#if false}}": {},
                                "{{#else}}": { c: 3 }
                            }
                        ]
                    },
                    concatArrays: {
                        "{{#concat}}": [
                            1,
                      [2, 3],
                            {
                                "{{#each array}}": "{{$key + 4}}"
                            },
                            5
                        ]
                    },
                    localVariables: {
                        "{{#let}}": [
                            {
                                var1: "val5",
                                var2: "val6"
                            },
                      ["{{var1}}", "{{var2}}"]
                        ]
                    }
                },
                data: {
                    value: "any value",
                    optionalValue: false,
                    object: {
                        key1: {
                            example: "val1",
                            keyInItem: "val2"
                        },
                    },
                    array: [
                        {
                            example: "val3",
                            keyInItem: "val4"
                        }
                    ],
                    num: 10.6
                }
            };
            return broker.call("v1.json4json.transform", params, opts).then(res => {
                expect(res).toBeDefined();
                expect(res).toEqual({
                    simpleValue: "any value",
                  // optionalValue droped
                    iteration: {
                        object: [
                            ["key1", "val1", "val2"]
                        ],
                        array: [
                            [0, "val3", "val4"]
                        ]
                    },
                    conditions: "elseif",
                    mergeObjects: {a: 1, b: 2, c: 3},
                    concatArrays: [1, 2, 3, 4, 5],
                    localVariables: ["val5", "val6"]
                });
            });
        });

        it("it should not kill the service", async () => {
            let params = {
                template: "{{process.exit(0)}}",
                data: {val: 1}
            };
            return broker.call("v1.json4json.transform", params, opts).then(res => {
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