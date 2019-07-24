/**
 * @license MIT, imicros.de (c) 2019 Andreas Leinen
 */
"use strict";

const {VM} = require("vm2");

process.on("message", async (msg) => {
    const sandbox = {
        meta: msg.meta,
        params: msg.params
    };

    const vm = new VM({
        timeout: 1000,
        sandbox: sandbox,
    });
    
    try {
        const result = await vm.run(msg.script);
        process.send(result || {});
    } catch (err) {
        process.send({ err: err.message });
    }
});

process.on("SIGTERM", () => {
    process.exit(0);
});

