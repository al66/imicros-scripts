/**
 * @license MIT, imicros.de (c) 2019 Andreas Leinen
 */
"use strict";

const _ = require("lodash");
const {VM} = require("vm2");

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
            
            const vm = new VM({
                timeout: 1000,
                sandbox: {
                    meta: ctx.meta,
                    params: ctx.params,
                    
                    // allowed functions and classes
                    getStream: (objectName) => { return this.getStream({ctx: ctx, objectName: objectName}); },
                    getJSON: async (objectName) => {  return JSON.parse(await this.getSync({ctx: ctx, objectName: objectName})); }
                }
            });
            
            let result = await vm.run(script);
            return { response: result.response || result, log: result.log || [] };
        }
    },

    /**
     * Service created lifecycle event handler
     */
    created() {},

    /**
     * Service started lifecycle event handler
     */
    started() {},

    /**
     * Service stopped lifecycle event handler
     */
    stopped() {}
    
};