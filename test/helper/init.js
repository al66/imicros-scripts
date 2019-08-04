const copy = require("./copy/copy");

let docker;
if (process.env.LOCAL_DOCKER) docker = {host: "http://192.168.2.124", port: 4243};

async function init({ owner }) {
    try {
        await copy({ host: docker, mountPath: process.env.MOUNT_PATH || "", owner: owner });
        console.log("copy is done");
    } catch (err) {
        console.log("Error during initialization", err);
    }
}

module.exports = { init: init };