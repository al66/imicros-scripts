"use strict";

const fs = require("fs");
const {VM} = require("vm2");


class store {
    putStream() {
        
    }
    getStream() {
        
    }
    pipeStream() {
        
    }
}

const sandbox = {
    test1: "input test1 ",
    test2: "input test2 ",
    store
};

const vm = new VM({
    sandbox: sandbox
});

let script = fs.readFileSync("assets/script1.js").toString();
let result = vm.run(script);
console.log(result);
console.log(sandbox);

