const cp = require("child_process");

// null means to use the default setting (pipe) for that fd
let options = { stdio: [null, null, null, "pipe"] };
let args = ["dev/runStream"];
let proc = cp.spawn("node", args, options);
let pipe = proc.stdio[3];
proc.on("error", (err) => {
    console.log(err);
});
proc.on("exit", (code) => {
    console.log(code);
});

pipe.write(Buffer("awesome"));
