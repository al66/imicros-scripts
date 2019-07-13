async function main() {
    let stream = await global.getStream("content1.json");
    let promise = await new Promise((resolve,reject) => {
        let buffers = [];
        stream.on("data", (chunk) => {
            buffers.push(chunk);
        });
        stream.on("close", () => {
            try {
                resolve(JSON.parse(buffers.concat()));
            } catch (err) {
                reject(err);
            }
        });
    });
    return promise;
}
main();
