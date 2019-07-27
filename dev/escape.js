"use strict";

const {VM} = require("vm2");

/*** UNSECURE - EXTERNAL FUNCTIONS CAN BE USED TO ESCAPE ***/
const sandbox = {
    evaluate: (expression, context) => {
        const func = new Function("context", `with(context){ return ${expression} }`); // eslint-disable-line no-new-func
        return func(context);
    }    
};

const vm = new VM({
    timeout: 1000,
    sandbox: sandbox,
    eval: false
});

try {
    //let result = vm.run("evaluate('function () { while(1) {}; return 1; }()',{})");
    let result = vm.run("evaluate('function () { console.log(process.env); process.exit(1) }()',{})");
    //let result = vm.run("try { this.process.removeListener(); } catch (e) { (e.constructor.constructor('evaluate(\"process.env\",\"process.env\")')()) }");
    console.log("Result:", result);
} catch (err) {
    console.log("Catched", {err: err});
}  
console.log(sandbox);

