const net = require("net"); 

console.log("Child started");

// now setup your child process like so
let pipe = new net.Socket({ fd: 3 });


pipe.on('data', function(buf) {
 // do whatever
    console.log(buf.toString());
});
pipe.on('end', function(buf) {
 // do whatever
    process.exit(0);
});