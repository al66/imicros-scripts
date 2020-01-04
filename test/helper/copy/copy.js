const Docker = require("dockerode");

let docker;

async function cleanup(container) {
    console.log("clean up");
    await container.stop().then((container)=>container.remove());
    let image = await docker.getImage("helper");
    if (image) await image.remove();
}

function runExec(container) {
    return new Promise(async (resolve, reject)=> {
        let options = {
            Cmd: ["bash", "-c", "cp -a /app/. /host"],
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

async function copy ({ host, mountPath, owner }) {
    return new Promise(async (resolve, reject)=> {
        try { 
            docker = new Docker(host);

            docker.createContainer({
                Image: "helper",
                Tty: true,
                Cmd: ["/bin/bash"],
                HostConfig: {
                    Binds: [`${mountPath}/${owner}:/host`]
                }
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

        } catch (e) {
            console.log(e);
            reject(e);
        }
    });
}

module.exports = copy;
