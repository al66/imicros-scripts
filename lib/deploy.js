/**
 * @license MIT, imicros.de (c) 2019 Andreas Leinen
 */
"use strict";

const _ = require("lodash");
const fs = require("fs");

/** Actions */
// action add  { objectName, name } => { } 
// action remove  { name } => { removed } 

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
         * @param {string} name - complete filename for deployment
         * 
         * @returns {object} {} or { error }
         */
        add: {
            params: {
                objectName: "string",
                filename: "string"
            },
            async handler(ctx) {
                let owner = this.getOwnerId({ ctx: ctx, abort: true });
                if (!ctx.params.filename.match(/.service\.js$/)) throw new Error("Wrong filename - must match pattern *.service.js");
                
                try {
                    await this.add({ ctx: ctx, objectName: ctx.params.objectName, name: ctx.params.filename, owner: owner });
                    return {};
                } catch (err) {
                    this.logger.info(err.message, { err: err });
                    throw new Error(err.message);
                }
            }
        },
        
        /**
         * remove a service file
         * 
         * @actions
         * @meta {object} acl
         * @param {string} name - complete filename
         * 
         * @returns {object} {} or { error }
         */
        remove: {
            params: {
                filename: "string"
            },
            async handler(ctx) {
                let owner = this.getOwnerId({ ctx: ctx, abort: true });
                
                try {
                    let result = await this.remove({ name: ctx.params.filename, owner: owner });
                    return result;
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
        },

        async remove({ name, owner }) {
            let filename = name;
            let path = this.path + owner+"/" + filename;
            
            function remove (path) {
                return new Promise((resolve,reject) => {
                    fs.stat(path,(err,stat) => {
                        if (stat) fs.unlink(path,(err) => {
                            if (err) return reject(err);
                            resolve();
                        }); 
                    });
                });
            }
            await remove(path);
            return { removed: filename };
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