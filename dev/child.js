const { fork } = require("child_process");

let start = Date.now();
let received = 0;
let count = 1;
let index = 0;
let single = () => {
    let n = ++index;
    
    const compute = fork("dev/run.js");

    const params = {
        template: { result: "{{val1}}", notAllowed: "{{#process.exit(0)}}" },
        data: { val1: n },
        add: (a) => { return a+5;}
    };
    
    compute.send(params);
    compute.on("message", result => {
        console.log(result);
        if (result.result === n) received++;
        if (received === count) {
            console.log("Consumed:", Date.now() - start);
            console.log("Received:", received);
        }
    });
    compute.on("exit", (code, signal) => {
        //console.log("Child process terminated with code: ", code), signal;
    });
};

let main = async () => {
    for (let i=0; i<count; i++ ) {
        await single();
    }
};
main();
