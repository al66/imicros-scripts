"use strict";

const {VM} = require("vm2");
const json4json = require("json4json").transform;

const sandbox = {
    template: { result: "{{val1}}", notAllowed: "{{#process.exit(0)}}" },
    data: { val1: 5 },
    transform: json4json
};

const vm = new VM({
    sandbox: sandbox,
    eval: true
});

let killed;
process.on("exit", (code) => {
    if (killed) console.log("Killed");
});

try {
    killed = true;
    let result = vm.run("transform(global.template,global.data)");
    console.log(result);
} catch (err) {
    /* */
} finally {
    killed = false;
}

console.log(sandbox);

