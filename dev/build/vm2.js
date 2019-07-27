"use strict";

const {NodeVM} = require("vm2");
const fs = require("fs");

let sandbox = { process: "" };

const vm = new NodeVM({
    console: "inherit",
    sandbox: sandbox,
    require: {
        external: true,
        context: sandbox,
        buildin: ["fs"],
    }
});

const script = fs.readFileSync(__dirname + "/runner.js").toString();

try {
    const result = vm.run(script,__filename);
    console.log(result);
} catch (err) {
    console.log(err);
}

