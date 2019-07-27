const Docker = require("dockerode");
const docker = new Docker({host: "http://192.168.2.124", port: 4243});
//const fs = require("fs");


function cleanup(container) {
    console.log("clean up");
    return container.stop().then((container)=>container.remove());
}

/**
 * Get env list from running container
 * @param container
 */
function runExec(container) {

    let options = {
        Cmd: ["bash", "-c", "echo test $VAR"],
        Env: ["VAR=ttslkfjsdalkfj"],
        AttachStdout: true,
        AttachStderr: true
    };

    container.exec(options, function(err, exec) {
        if (err) return;
        exec.start(async (err, stream) => {
            if (err) return;

            container.modem.demuxStream(stream, process.stdout, process.stderr);

            exec.inspect((err, data) => {
                if (err) return;
                console.log(data);
            });
            
            stream.on("end", () => {cleanup(container);});
        });
    });
    
}

docker.createContainer({
    Image: "ubuntu",
    Tty: true,
    Cmd: ["/bin/bash"]
})
.then(async (container) => {
    await container.start({}, async (err, data) => {
        await runExec(container);
    });
    return container;
})
.catch((err) => {
    console.log(err);
});
