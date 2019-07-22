/**
 * @license MIT, imicros.de (c) 2019 Andreas Leinen
 */
"use strict";

//const {VM} = require("vm2");
//const json4json = require("json4json").transform;
const { fork } = require("child_process");

/** Actions */
// action run  @meta.scriptName { params } => { result } 

module.exports = {
    name: "json4json",
    
    /**
     * Service settings
     */
    settings: {},

    /**
     * Service metadata
     */
    metadata: {},

    /**
     * Service dependencies
     */
    //dependencies: [],	

    /**
     * Actions
     */
    actions: {

        /**
         * run json4json transformation
         * 
         * @actions
         * @param {string} template
         * @param {object} data
         * 
         * @returns {object} result
         */
        transform: {
            params: {
                template: [
                    {type: "string"},
                    {type: "object"}
                ],
                data: {type: "object"}
            },			
            async handler(ctx) {
                
                return await this.transform(ctx.params.template, ctx.params.data);
                /*
                const vm = new VM({
                    timeout: 1000,
                    sandbox: {
                        template: ctx.params.template,
                        data: ctx.params.data,

                        // allowed functions and classes
                        transform: json4json
                    }
                });

                
                // nice try..but if the process is killed the logger is not flushed at all...
                let script = { type: "json4json", template: ctx.params.template };
                await this.logger.info("start script", { script: script });
                process.on("uncaughtException", (err) => {
                    this.logger.info(err.message, { err: err });
                });
                process.on("exit", () => {
                    this.logger.warn("process killed by script", { script: script });
                });                
                
                try {
                    let result = await vm.run("function main () { return global.transform(global.template,global.data); } main();");
                    script = null;
                    return result;
                } catch (err) {
                    this.logger.info(err.message, { err: err });
                    script = null;
                    throw new Error(err.message);
                } finally {
                    script = null;
                }
                */
            }
        }
        
    },

    /**
     * Events
     */
    events: {},

    /**
     * Methods
     */
    methods: {
        
        transform(template,data) {
            let self = this;
            
            return new Promise((resolve, reject) => {
                let runner = self.idle.pop();

                if (!runner) {
                    this.logger.debug("no runner available", { idle: self.idle.length });
                    reject(new Error("no runner available"));
                }
                
                function idle () {
                    runner.removeListener("message", onMessage);
                    runner.removeListener("error", onError);
                    runner.removeListener("exit", onExit);
                    self.idle.push(runner);
                }
                
                let onMessage = (msg) => {
                    this.logger.debug("received", { pid: runner.pid, msg: msg });
                    idle();
                    resolve(msg);
                };
                
                let onError = (err) => {
                    idle();
                    reject(err);
                };

                let onExit = (code) => {
                    if (!this.stopped) {
                        this.logger.debug("process killed by script", { pid: runner.pid, code: code });
                        // create a new one
                        if (!this.stopped) this.idle.push(fork(`${__dirname}/json4json-child.js`));
                    }
                    resolve({});
                };
                
                runner.on("message", onMessage);
                runner.on("error", onError);
                runner.on("exit", onExit);
                this.logger.debug("send task to runner", { pid: runner.pid });
                runner.send({ template: template, data: data});
            });
        }
        
    },

    /**
     * Service created lifecycle event handler
     */
    created() {
        this.idle = [];
        for (let i=0; i<4; i++) this.idle.push(fork(`${__dirname}/json4json-child.js`));
    },

    /**
     * Service started lifecycle event handler
     */
    started() {
    },

    /**
     * Service stopped lifecycle event handler
     */
    stopped() {
        this.stopped = true;
        for (let i=0; i<this.idle.length; i++) this.idle[i].kill();
    }
    
};