"use strict";

const cp = require("child_process");

module.exports = {
    name: "greeter",
    actions: {
        hello() {
            return "Hello API Gateway - really hot!";
        },
        env() {
            return process.env;
        },
        exit() {
            return process.exit(0);
        },
        child() {
            let env = Object.create( process.env );
            env.NODE_ENV = "test";
            let options = { stdio: ["pipe","pipe","pipe"], env: env };
            try {
                // let proc = cp.spawn("echo", args, options);
                let result = cp.spawn("node", ["-v"], options);
                //let result = cp.spawn("npm", ["i","ioredis"]);
                //console.log(result);
                result.stdout.on("data", function(data) {
                    console.log(data.toString()); 
                });
            } catch (e) {
                console.log(e);
            }
            return "done";
        }
    }
};
