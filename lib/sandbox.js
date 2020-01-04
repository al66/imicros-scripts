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
    settings: {
        /*
        adminGroup: <id of admingroup>
        */
    },

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
        },
        
        status: {
            async handler(ctx) {
                let owner = this.getOwnerId({ ctx: ctx, abort: true });
                
                try {
                    let result = await this.status({ owner: owner });
                    return result;
                } catch (err) {
                    this.logger.info(err.message, { err: err });
                    throw new Error(err.message);
                }
            }
        },
        
        start: {
            async handler(ctx) {
                let owner = this.getOwnerId({ ctx: ctx, abort: true });
                
                try {
                    let result = await this.start({ owner: owner });
                    return result;
                } catch (err) {
                    this.logger.info(err.message, { err: err });
                    throw new Error(err.message);
                }
            }
        },
        
        stop: {
            async handler(ctx) {
                let owner = this.getOwnerId({ ctx: ctx, abort: true });
                
                try {
                    let result = await this.stop({ owner: owner });
                    return result;
                } catch (err) {
                    this.logger.info(err.message, { err: err });
                    throw new Error(err.message);
                }
            }
        },
        
        pause: {
            async handler(ctx) {
                let owner = this.getOwnerId({ ctx: ctx, abort: true });
                
                try {
                    let result = await this.pause({ owner: owner });
                    return result;
                } catch (err) {
                    this.logger.info(err.message, { err: err });
                    throw new Error(err.message);
                }
            }
        },
        
        resume: {
            async handler(ctx) {
                let owner = this.getOwnerId({ ctx: ctx, abort: true });
                
                try {
                    let result = await this.resume({ owner: owner });
                    return result;
                } catch (err) {
                    this.logger.info(err.message, { err: err });
                    throw new Error(err.message);
                }
            }
        },
        
        remove: {
            async handler(ctx) {
                let owner = this.getOwnerId({ ctx: ctx, abort: true });
                
                try {
                    let result = await this.remove({ owner: owner });
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
        async launch({ owner }) {
            this.containerSettings.name = owner;
            this.containerSettings.Labels["traefik.frontend.rule"] = `PathPrefixStrip:/${owner}/`;
            this.containerSettings.Labels["imicros.owner"] =  `${owner}`;

            // Add to Bindings: /path/to/host/services/{groupId}:/app/services
            this.containerSettings.HostConfig.Binds.push(`${this.mountPath}/${owner}:/app/services`);
            
            this.logger.debug("Create sandbox container", { settings: this.containerSettings });
            
            let self = this;
            
            return this.docker.createContainer(this.containerSettings)
            .then(async (container) => {
                let networkName = self.traefik.network;
                let net = this.docker.getNetwork(networkName);
                net.connect({Container: container.id}, function(err/*, data*/) {
                    if (err) return console.log("Failed to connect to external network",networkName);
                });
                self.logger.info("Sandbox container created", { owner: owner, settings: self.containerSettings });
                return await container.start();
            })
            .catch((err) => {
                console.log(err);
                throw err;
            }); 
        },
        
        async start({ owner }) {
            let list = await this.status({ owner: owner });
            let self = this;
            await Promise.all(list.map(async (container)=>{
                if (container.status === "created" || container.status === "stopped") {
                    self.logger.debug("Start container", { owner: owner, id: container.id, status: container.status });
                    await self.docker.getContainer(container.id).start();
                    self.logger.debug("Container started", { owner: owner, id: container.id });
                    Promise.resolve();
                } else {
                    Promise.resolve();
                } 
            }));
            return true;
        },
        
        async pause({ owner }) {
            let list = await this.status({ owner: owner });
            let self = this;
            await Promise.all(list.map(async (container)=>{
                if (container.status === "running") {
                    self.logger.debug("Pause container", { owner: owner, id: container.id, status: container.status });
                    await self.docker.getContainer(container.id).pause();
                    self.logger.debug("Container paused", { owner: owner, id: container.id });
                    Promise.resolve();
                } else {
                    Promise.resolve();
                } 
            }));
            return true;
        },
        
        async resume({ owner }) {
            let list = await this.status({ owner: owner });
            let self = this;
            await Promise.all(list.map(async (container)=>{
                if (container.status === "paused") {
                    self.logger.debug("Resume paused container", { owner: owner, id: container.id, status: container.status });
                    await self.docker.getContainer(container.id).unpause();
                    self.logger.debug("Container running again", { owner: owner, id: container.id });
                    Promise.resolve();
                } else {
                    Promise.resolve();
                } 
            }));
            return true;
        },
        
        async stop({ owner }) {
            let list = await this.status({ owner: owner });
            let self = this;
            this.logger.debug("Stop containers", { owner: owner, count: list.length });
            try {
                await Promise.all(list.map(async (container)=>{
                    if (container.status === "running" || container.status === "paused") {
                        self.logger.debug("Stop container", { owner: owner, id: container.id, status: container.status });
                        try {
                            await self.docker.getContainer(container.id).stop({ t: this.waitUntilKill });
                        } catch (err) {
                            self.logger.debug("Failed to stop container", { owner: owner, id: container.id, err: err });
                            Promise.reject(err);
                        }
                        self.logger.debug("Container stopped", { owner: owner, id: container.id });
                        Promise.resolve();
                    } else {
                        Promise.resolve();
                    } 
                }));
            } catch (err) {
                this.logger.debug("Failed to stop all containers", { owner: owner, err: err });
            }
            this.logger.debug("All containers stopped", { owner: owner });
            return true;
        },
        
        async remove({ owner }) {
            // stop running or paused containers first
            await this.stop({ owner: owner });

            let list = await this.status({ owner: owner });
            let self = this;

            // remove existing
            await Promise.all(list.map(async (container)=>{
                self.logger.debug("Remove container", { owner: owner, id: container.id, status: container.status });
                let sb = await self.docker.getContainer(container.id);
                await sb.remove();
                self.logger.debug("Container removed", { owner: owner, id: container.id });
                Promise.resolve();
            }));
            return true;
        },
        
        async status({ owner }) {
            let opts = {
                all: true,
                filters: `{"label": ["imicros.owner=${owner}"]}`
            };
            let res = await this.docker.listContainers(opts);
            this.logger.debug(`Container status of owner ${owner}`, { res: res });
            let stateMap = {
                "exited": "stopped"
            };
            if (Array.isArray(res) && res.length > 0) {
                return res.map((a) => { return { id: a.Id, status: stateMap[a.State] ? stateMap[a.State] : a.State };});
            } else {
                return [];
            }
        }
        
    },

    /**
     * Service created lifecycle event handler
     */
    created() {
        
        this.adminGroup = _.get(this.settings,"adminGroup","XXX NOT DEFINED XXX"); 
        
        this.mountPath = _.get(this.settings,"mount.path","");
        this.traefik = { 
            network: _.get(this.settings,"traefik.network","sandbox-net"),
            tags: _.get(this.settings,"traefik.tags","sandbox-stack")
        };
        
        this.image = _.get(this.settings,"container.image","my-own-build");
        if (!this.image) throw new Error("Missing image name (settings.container.image)");
        this.logger.info("Use image", { image: this.image });
        
        this.waitUntilKill = _.get(this.settings,"container.waitUntilKill",1);
        
        this.containerSettings = {
            Image: this.image,
            Tty: false,
            Env: ["SERVICEDIR=services"],
            Cmd: ["node","runner"],
            //ExposedPorts: { "3000": { HostPort: "9067"} },
            HostConfig: {
                Binds: []
                //PortBindings: { "3000": [{ HostPort: "9067"}] }
            },
            Labels: {
                "traefik.frontend.rule": "PathPrefixStrip:/{groupId}/",
                "traefik.docker.network": this.traefik.network,
                "traefik.tags": this.traefik.tags,
                "traefik.port": "3000"
            },
            timeout: 1000
        };
        
        // refer to dockerode for settings 
        try {
            this.logger.debug("Docker settings", { docker: _.get(this.settings,"docker") });
            this.docker =  new Docker(_.get(this.settings,"docker"));
        } catch (err) {
            this.logger.error("Initialization of docker failed", { settings: _.get(this.settings,"docker") });
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