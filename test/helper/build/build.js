const Docker = require("dockerode");
let docker;

let dir = __dirname + "";

async function cleanup(container) {
    console.log("clean up");
    await container.stop().then((container)=>container.remove());
}

function runExec(container) {
    return new Promise(async (resolve, reject)=> {
        let options = {
            Cmd: ["node", "runner"],
            AttachStdout: true,
            AttachStderr: true
        };

        container.exec(options, function(err, exec) {
            if (err) return reject(err);
            exec.start(async (err, stream) => {
                if (err) return reject(err);

                container.modem.demuxStream(stream, process.stdout, process.stderr);

                exec.inspect((err /*, data*/) => {
                    if (err) return reject(err);
                    //console.log(data);
                });

                stream.on("end", () => {resolve(); cleanup(container);});
            });
        });
    });
}

async function build ({host,image}) {
    return new Promise(async (resolve, reject) => {
        try {
            docker = new Docker(host);

            let stream = await docker.buildImage({
                context: dir,
                src: ["Dockerfile","package.json","runner.js"]
            }, {t: image});

            stream.pipe(process.stdout, {
                end: true
            });

            stream.on("end", function() {
                console.log("END");
            });        
            
            await new Promise((resolve, reject) => {
                docker.modem.followProgress(stream, (err, res) => err ? reject(err) : resolve(res));
            });

            docker.createContainer({
                Image: image,
                Tty: true,
                Cmd: ["node","runner"]
            })
            .then(async (container) => {
                await container.start({}, async (err/*, data*/) => {
                    if (err) throw err;
                    await runExec(container);
                    resolve();
                });
                return container;
            })
            .catch((err) => {
                console.log(err);
                reject(err);
            });

        } catch (err) {
            reject(err);
        }
    });
}

module.exports = build;

