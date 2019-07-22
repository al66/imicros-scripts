/**
 * @license MIT, imicros.de (c) 2019 Andreas Leinen
 */
"use strict";

const {VM} = require("vm2");
const json4json = require("json4json").transform;

process.on("message", async (msg) => {
    const sandbox = {
        template: msg.template,
        data: msg.data,
        transform: json4json
    };

    const vm = new VM({
        timeout: 1000,
        sandbox: sandbox,
    });
    
    const result = vm.run("transform(global.template,global.data)");
    process.send(result);
});

process.on("SIGTERM", () => {
    process.exit(0);
});

