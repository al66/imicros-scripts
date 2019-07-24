/**
 * @license MIT, imicros.de (c) 2019 Andreas Leinen
 */
"use strict";

const _ = require("lodash");
const { fork } = require("child_process");

/** Actions */
// action run  @meta.scriptName { params } => { result } 

module.exports = {
    name: "scripts",
    
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
         * run script
         * 
         * @actions
         * @meta {string} scriptName
         * @param {any} params
         * 
         * @returns {any} result
         */
        run: {
            async handler(ctx) {
                let scriptName = _.get(ctx.meta,"scriptName",null);
                if (!scriptName) throw new Error("missing script name");

                if (!await this.isAuthorized({ ctx: ctx, ressource: { scriptName: scriptName }, action: "run" })) throw new Error("not authorized");
                
                try {
                    let result = await this.run({ctx: ctx, scriptName: scriptName });
                    return result.response;
                } catch (err) {
                    this.logger.info(err.message, { err: err });
                    throw new Error(err.message);
                }
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
        async run({ ctx, scriptName}) {
            
            // get script from object store
            let script = await this.getSync({ctx: ctx, objectName: scriptName});

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
                    if (msg.err) reject(new Error(msg.err));
                    resolve({ response: msg.response || msg, log: msg.log || [] });
                };
                
                let onError = (err) => {
                    idle();
                    reject(err);
                };

                let onExit = (code) => {
                    if (!this.stopped) {
                        this.logger.debug("process killed by script", { pid: runner.pid, code: code });
                        // create a new one
                        if (!this.stopped) this.idle.push(fork(`${__dirname}/scripts-child.js`));
                    }
                    resolve({});
                };
                
                runner.on("message", onMessage);
                runner.on("error", onError);
                runner.on("exit", onExit);
                this.logger.debug("send task to runner", { pid: runner.pid });
                
                // due to security reasons send only strings or parsed objects!
                let msg = {
                    script: script.toString(),
                    meta: JSON.parse(JSON.stringify(ctx.meta)),
                    params: JSON.parse(JSON.stringify(ctx.params))
                };
                
                runner.send(msg);
            });
        }
    },

    /**
     * Service created lifecycle event handler
     */
    created() {
        this.idle = [];
        for (let i=0; i<4; i++) this.idle.push(fork(`${__dirname}/scripts-child.js`));
    },

    /**
     * Service started lifecycle event handler
     */
    started() {},

    /**
     * Service stopped lifecycle event handler
     */
    stopped() {
        this.stopped = true;
        for (let i=0; i<this.idle.length; i++) this.idle[i].kill();
    }
    
};