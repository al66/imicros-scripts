/**
 * @license MIT, imicros.de (c) 2019 Andreas Leinen
 */
"use strict";

const Docker = require("dockerode");
const _ = require("lodash");

/** Actions */
// action launch  { } => { error } 

module.exports = {
    name: "sandbox",
    
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
         * launch docker container for owner
         * 
         * @actions
         * @meta {object} acl
         * @param -
         * 
         * @returns {object} {} or { error }
         */
        launch: {
            async handler(ctx) {
                let owner = this.getOwnerId({ ctx: ctx, abort: true });
                
                try {
                    await this.launch({ owner: owner });
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
        async launch({ owner }) {
            this.containerSettings.name = owner;
            this.containerSettings.Labels["traefik.frontend.rule"] = `PathPrefixStrip:/${owner}/`;
            
            console.log(this.containerSettings);
            return this.docker.createContainer(this.containerSettings)
            .then((container) => {
                let networkName = "proxy";
                let net = this.docker.getNetwork(networkName);
                net.connect({Container: container.id}, function(err/*, data*/) {
                    if (err) return console.log("Failed to connect to external network",networkName);
                });
                return container.start();
            })
            .catch((err) => {
                console.log(err);
                throw err;
            }); 
        }
        
    },

    /**
     * Service created lifecycle event handler
     */
    created() {
        
        this.mountPath = _.get(this.settings,"mount.path","/home/sandbox/");
        this.traefik = { 
            network: _.get(this.settings,"traefik.network","proxy")
        };
            
        this.containerSettings = {
            Image: _.get(this.settings,"container.Image","my-own-build"),
            Tty: false,
            Env: ["SERVICEDIR=services"],
            //ExposedPorts: { "3000": { HostPort: "9067"} },
            HostConfig: {
                Binds: ["/home/andreas/g1/services:/app/services"]
                //PortBindings: { "3000": [{ HostPort: "9067"}] }
            },
            Labels: {
                "traefik.frontend.rule": "PathPrefixStrip:/{groupId}/",
                "traefik.docker.network": this.traefik.network,
                "traefik.port": "3000"
            },
            timeout: 1000
        };
        
        // refer to dockerode for settings 
        try {
            this.docker =  new Docker(_.get(this.settings,"docker"));
        } catch (err) {
            this.logger.error("Connection to docker host failed", { settings: _.get(this.settings,"docker") });
            throw err;
        }
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