"use strict";

require("../../local.js");
const build = require("./build/build");
const buildHelper = require("./copy/build");

let docker;
if (process.env.LOCAL_DOCKER) docker = {host: "http://192.168.2.124", port: 4243};

async function init() {
    try {
        await build({ host: docker, image: process.env.IMAGE || "" });
        console.log(`build ${process.env.IMAGE} image is done`);
        await buildHelper({ host: docker });
        console.log("build helper image is done");
    } catch (err) {
        console.log("Error during initialization", err);
    }
}
init();