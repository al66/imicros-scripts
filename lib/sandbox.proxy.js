/**
 * @license MIT, imicros.de (c) 2019 Andreas Leinen
 */
"use strict";

const _ = require("lodash");
const request = require("request");
const stream = require("stream");

/** Actions */
// action launch  { } => { error } 

module.exports = {
    name: "sandbox.proxy",
    
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
    actions: {},

    /**
     * Events
     */
    events: {},

    /**
     * Methods
     */
    methods: {
    
        routeToSandbox(req ,res, isstream) {
            //req.$service.broker.logger.debug("req.$ctx", { ctx: req.$ctx });
            //req.$service.broker.logger.debug("req.$action", { action: req.$action });
            //req.$service.broker.logger.debug("req.$params", { params: req.$params });
            //req.$service.broker.logger.debug("body", { body: req.$params.body });
            /*
            let info = {
                readableStream: req.readableStream,
                req: req,
                message: req.IncomingMessage
            };
            req.$service.broker.logger.debug("request info", { info: info });
            */
            let owner = _.get(req.$ctx.meta,"acl.ownerId",null);
            if (!owner) return res.error("Not authorized");
            //let readable = null; //req.IncomingMessage.readable;
            let version = _.get(req.$params,"params.sandboxServiceVersion","");
            let action = ( version ? version + "/" : "" ) +
                         _.get(req.$params,"params.sandboxService","") + "/" + 
                         _.get(req.$params,"params.sandboxAction","");
            let query = "";
            if ( req.$params.query && req.$params.query instanceof Object && !_.isEmpty(req.$params.query) ) {
                query = "?";
                Object.keys(req.$params.query).map(function(key/*, index*/) {
                    if ( query.length > 1 ) query += " && ";
                    query += `${key}=${req.$params.query[key]}`;
                });
            }
            if (req instanceof stream) {
                req.$service.broker.logger.debug("request stream", { 
                    readable: typeof req._read == "function",
                    readableState: typeof req._readableState == "object",
                    method: req.method
                });
            }
            if (isstream && req instanceof stream && ( req.method === "PUT" || req.method === "POST")) {
                action = "upload/" + action;
                let options = {
                    uri: this.sandbox.baseUrl + owner + "/" + action + query,
                    method: req.method,
                    //json: req.$params.params.body instanceof Object ? req.$params.params.body : null
                    json: req.$params.body
                };
                req.$service.broker.logger.debug("request sandbox", { options: options });
                req.pipe(request(options)).pipe(res);
            } else {
                let options = {
                    uri: this.sandbox.baseUrl + owner + "/" + action + query,
                    method: req.method,
                    //json: req.$params.params.body instanceof Object ? req.$params.params.body : null
                    json: req.$params.body
                };
                req.$service.broker.logger.debug("request sandbox", { options: options });
                request(options).pipe(res);
            }
        }
                    
    },

    /**
     * Service created lifecycle event handler
     */
    created() {
        this.sandbox = {
            baseUrl: _.get(this.settings,"sandbox.baseUrl","http://localhost")
        };
    },

    /**
     * Service started lifecycle event handler
     */
    started() {},

    /**
     * Service stopped lifecycle event handler
     */
    stopped() {}
    
};