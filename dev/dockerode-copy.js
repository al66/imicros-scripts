const Docker = require("dockerode");

let dir = __dirname + "\\helper\\";
let docker;

async function cleanup(container) {
    console.log("clean up");
    await container.stop().then((container)=>container.remove());
    let image = await docker.getImage("helper");
    if (image) await image.remove();
}

function runExec(container) {

    let options = {
        Cmd: ["bash", "-c", "cp -a /app/. /host"],
        //Cmd: ["bash", "-c", "ls /"],
        Env: ["VAR=ttslkfjsdalkfj"],
        AttachStdout: true,
        AttachStderr: true
    };

    container.exec(options, function(err, exec) {
        if (err) return console.log(err);
        exec.start(async (err, stream) => {
            if (err) return console.log(err);

            container.modem.demuxStream(stream, process.stdout, process.stderr);

            exec.inspect((err, data) => {
                if (err) return console.log(err);
                console.log(data);
            });
            
            stream.on("end", () => {cleanup(container);});
        });
    });
    
}

async function build ({ host, mountPath, owner }) {
    try { 
        docker = new Docker(host);
        
        let stream = await docker.buildImage({
            context: dir,
            src: ["Dockerfile","services\\gateway.service.js","services\\greeter.service.js"]
        }, {t: "helper"});

        stream.pipe(process.stdout, {
            end: true
        });

        stream.on("end", function() {
            //done();
            console.log("END");
        });        

        await new Promise((resolve, reject) => {
            docker.modem.followProgress(stream, (err, res) => err ? reject(err) : resolve(res));
        });
        
        docker.createContainer({
            Image: "helper",
            Tty: true,
            Cmd: ["/bin/bash"],
            HostConfig: {
                Binds: [`${mountPath}/${owner}:/host`]
                //Binds: ["/home/andreas/services:/host"]
            }
        })
        .then(async (container) => {
            await container.start({}, async (err/*, data*/) => {
                if (err) throw err;
                await runExec(container);
            });
            return container;
        })
        .catch((err) => {
            console.log(err);
        });
        
    } catch (e) {
        console.log(e);
    }
}

build({ host: {host: "http://192.168.2.124", port: 4243}, mountPath: "/home/andreas/sandboxes", owner: "5e23ebd3-b671-4635-b680-92356f4972bd" });
