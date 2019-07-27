const Docker = require("dockerode");
const docker = new Docker({host: "http://192.168.2.124", port: 4243});

let dir = __dirname + "\\build\\";
console.log(dir);

async function build () {
    let stream = docker.buildImage({
        context: dir,
        src: ["Dockerfile","package.json","moleculer.config.js","services\\gateway.service.js","services\\greeter.service.js"]
    }, {t: "my-own-build"}, function (err, stream) {
        if (err) return console.log(err);

        stream.pipe(process.stdout, {
            end: true
        });

        stream.on("end", function() {
            //done();
            console.log("END");
        });        
        //console.log(response);
      //...
    });
    /*
    try {
        await new Promise((resolve, reject) => {
          docker.modem.followProgress(stream, (err, res) => err ? reject(err) : resolve(res));
        });    
    } catch (e) {
        console.log(e);
    }
    */
}

build();
