"use strict";

const ApiService = require("moleculer-web");

module.exports = {
    name: "gateway",
    mixins: [ApiService],

    /**
     * Service settings
     */
    settings: {
        routes: [
            {
                path: "/",

                bodyParsers: {
                    json: true
                },

                authorization: false
            }
        ]
                
    },

    /**
     * Service metadata
     */
    metadata: {},

    /**
     * Service methods
     */
    methods: {}
    
};