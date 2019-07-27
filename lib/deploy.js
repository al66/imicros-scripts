/**
 * @license MIT, imicros.de (c) 2019 Andreas Leinen
 */
"use strict";

const _ = require("lodash");
const fs = require("fs");

/** Actions */
// action add  { objectName, name } => { error } 

module.exports = {
    name: "deploy",
    
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
         * add/update a service file
         * 
         * @actions
         * @meta {object} acl
         * @param {string} objectName - stored object to pull
         * @param {string} name - service name or complete filename for deployment
         * 
         * @returns {object} {} or { error }
         */
        add: {
            params: {
                objectName: "string",
                name: "string"
            },
            async handler(ctx) {
                let owner = this.getOwnerId({ ctx: ctx, abort: true });
                
                try {
                    await this.add({ ctx: ctx, objectName: ctx.params.objectName, name: ctx.params.name, owner: owner });
                    return {};
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

        async add({ ctx, objectName, name, owner }) {
            let path = this.path + owner+"/";
            let filename = name;
            
            function mkdir (path) {
                return new Promise((resolve,reject) => {
                    fs.stat(path,(err,stat) => {
                        if (err || !stat) fs.mkdir(path,(err) => {
                            if (err) return reject(err);
                            resolve();
                        }); 
                    });
                });
            }
            await mkdir(path);

            let fstream = fs.createWriteStream(path + filename);
            function receive(stream) {
                return new Promise(resolve => {
                    stream.pipe(fstream);
                    fstream.on("close", () => { resolve(); });
                });
            } 
            let stream = await this.getStream({ ctx: ctx, objectName: objectName });

            await receive(stream);
            return { filename: filename };
        }
        
    },

    /**
     * Service created lifecycle event handler
     */
    created() {
        
        this.path = _.get(this.settings,"path","");
        
    },

    /**
     * Service started lifecycle event handler
     */
    started() {},

    /**
     * Service stopped lifecycle event handler
     */
    stopped() {
    }
    
};