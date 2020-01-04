/*** NOT SECURE!!! ***/
global.getJSON("content1.json")
    .then(data => { return {data: data, sum: data.test1 + data.test2, params: global.params, meta: global.meta};});