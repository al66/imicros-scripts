"use strict";

const {VM} = require("vm2");

const sandbox = {
    evaluate: (expression, context) => {
        const func = new Function("context", `with(context){ return ${expression} }`); // eslint-disable-line no-new-func
        return func(context);
    }    
};

const vm = new VM({
    timeout: 1000,
    sandbox: sandbox,
    eval: true
});

//let result = vm.run("evaluate('function () { return 1; }()')");
try {
    //let result = vm.run("evaluate('function () { while(1) {}; return 1; }()',{})");
    let result = vm.run("try { this.process.removeListener(); } catch (e) { (JSON.stringify(this));}");
    console.log("Result:", result);
} catch (err) {
    console.log("Catched", {err: err});
}  
console.log(sandbox);
