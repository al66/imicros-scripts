"use strict";

const {VM} = require("vm2");
const json4json = require("json4json").transform;

process.on("message", (msg) => {
    const sandbox = {
        template: msg.template,
        data: msg.data,
        transform: json4json,
        add: (a) => { return a+5;}
    };

    const vm = new VM({
        sandbox: sandbox,
    });
    
    const result = vm.run("global.data.val1++; global.data.val1 = global.add(global.data.val1); transform(global.template,global.data)");
    process.send(result);
    process.exit(0);
});
