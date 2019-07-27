const Docker = require("dockerode");
const docker = new Docker({host: "http://192.168.2.124", port: 4243});


docker.listContainers(function (err, containers) {
    containers.forEach(function (containerInfo) {
        console.log(containerInfo);
    });
});